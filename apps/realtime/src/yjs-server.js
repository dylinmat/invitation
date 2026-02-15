const Y = require("yjs");
const { Awareness } = require("y-protocols/awareness");
const { redisClient, INSTANCE_ID } = require("./redis-client");
const { persistence } = require("./persistence");

const SNAPSHOT_INTERVAL_MS = parseInt(
  process.env.SNAPSHOT_INTERVAL_MS || "30000",
  10
);
const DOC_TIMEOUT_MS = parseInt(process.env.DOC_TIMEOUT_MS || "300000", 10);

// Message types for Yjs protocol
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_AUTH = 2;

/**
 * Room manages a single collaboration session
 */
class Room {
  constructor(roomId, siteId, version) {
    this.roomId = roomId;
    this.siteId = siteId;
    this.version = version;
    this.doc = new Y.Doc();
    this.awareness = new Awareness(this.doc);
    this.clients = new Map(); // Map<ws, clientInfo>
    this.isLoaded = false;
    this.lastActivity = Date.now();
    this.lastSnapshot = 0;
    this.snapshotTimer = null;
    this.destroyed = false;

    // Setup awareness change handler
    this.awareness.on("update", this.handleAwarenessUpdate.bind(this));

    // Setup document update handler for persistence
    this.doc.on("update", this.handleDocUpdate.bind(this));

    // Subscribe to Redis broadcast channel for multi-instance sync
    this.setupRedisSubscription();
  }

  async setupRedisSubscription() {
    await redisClient.subscribeToRoom(this.roomId, (message) => {
      if (message.instanceId === INSTANCE_ID) return; // Ignore own messages

      if (message.type === "awareness" && message.data) {
        // Apply remote awareness update
        const update = new Uint8Array(Buffer.from(message.data, "base64"));
        this.applyAwarenessUpdate(update, false); // Don't broadcast back
      }
    });
  }

  /**
   * Load document from persistence
   */
  async load() {
    if (this.isLoaded) return;

    const data = await persistence.loadSceneGraph(this.siteId, this.version);
    if (data && data.sceneGraph) {
      // Convert scene graph to Yjs document structure
      this.populateFromSceneGraph(data.sceneGraph);
    }

    this.isLoaded = true;
    this.lastSnapshot = await redisClient.getLastSnapshotTime(this.roomId);

    // Start snapshot timer
    this.startSnapshotTimer();
  }

  /**
   * Populate Y.Doc from scene graph JSON
   */
  populateFromSceneGraph(sceneGraph) {
    const root = this.doc.getMap("root");

    // Set canvas
    if (sceneGraph.canvas) {
      const canvas = new Y.Map();
      for (const [key, value] of Object.entries(sceneGraph.canvas)) {
        canvas.set(key, value);
      }
      root.set("canvas", canvas);
    }

    // Set assets
    if (sceneGraph.assets) {
      const assets = new Y.Map();
      for (const [type, items] of Object.entries(sceneGraph.assets)) {
        const typeMap = new Y.Map();
        for (const [id, item] of Object.entries(items)) {
          const itemMap = new Y.Map();
          for (const [key, value] of Object.entries(item)) {
            itemMap.set(key, value);
          }
          typeMap.set(id, itemMap);
        }
        assets.set(type, typeMap);
      }
      root.set("assets", assets);
    }

    // Set nodes
    if (sceneGraph.nodes) {
      const nodes = new Y.Array();
      for (const node of sceneGraph.nodes) {
        const nodeMap = new Y.Map();
        for (const [key, value] of Object.entries(node)) {
          if (key === "position" || key === "size" || key === "style" || key === "props") {
            const nestedMap = new Y.Map();
            for (const [k, v] of Object.entries(value)) {
              nestedMap.set(k, v);
            }
            nodeMap.set(key, nestedMap);
          } else {
            nodeMap.set(key, value);
          }
        }
        nodes.push([nodeMap]);
      }
      root.set("nodes", nodes);
    }

    // Set components
    if (sceneGraph.components) {
      const components = new Y.Array();
      for (const comp of sceneGraph.components) {
        const compMap = new Y.Map();
        for (const [key, value] of Object.entries(comp)) {
          if (key === "position" || key === "size" || key === "props") {
            const nestedMap = new Y.Map();
            for (const [k, v] of Object.entries(value)) {
              nestedMap.set(k, v);
            }
            compMap.set(key, nestedMap);
          } else {
            compMap.set(key, value);
          }
        }
        components.push([compMap]);
      }
      root.set("components", components);
    }

    // Set metadata
    root.set("version", sceneGraph.version || 1);
  }

  /**
   * Convert Y.Doc to scene graph JSON
   */
  toSceneGraph() {
    const root = this.doc.getMap("root");

    const sceneGraph = {
      version: root.get("version") || 1,
      canvas: {},
      assets: { images: {}, fonts: {} },
      nodes: [],
      components: [],
    };

    // Extract canvas
    const canvas = root.get("canvas");
    if (canvas) {
      sceneGraph.canvas = this.yMapToObject(canvas);
    }

    // Extract assets
    const assets = root.get("assets");
    if (assets) {
      sceneGraph.assets = {};
      for (const [type, typeMap] of assets.entries()) {
        sceneGraph.assets[type] = {};
        for (const [id, itemMap] of typeMap.entries()) {
          sceneGraph.assets[type][id] = this.yMapToObject(itemMap);
        }
      }
    }

    // Extract nodes
    const nodes = root.get("nodes");
    if (nodes) {
      sceneGraph.nodes = nodes.toArray().map((nodeMap) => {
        const node = this.yMapToObject(nodeMap);
        // Handle nested maps
        if (node.position) node.position = this.yMapToObject(nodeMap.get("position"));
        if (node.size) node.size = this.yMapToObject(nodeMap.get("size"));
        if (node.style) node.style = this.yMapToObject(nodeMap.get("style"));
        if (node.props) node.props = this.yMapToObject(nodeMap.get("props"));
        return node;
      });
    }

    // Extract components
    const components = root.get("components");
    if (components) {
      sceneGraph.components = components.toArray().map((compMap) => {
        const comp = this.yMapToObject(compMap);
        if (comp.position) comp.position = this.yMapToObject(compMap.get("position"));
        if (comp.size) comp.size = this.yMapToObject(compMap.get("size"));
        if (comp.props) comp.props = this.yMapToObject(compMap.get("props"));
        return comp;
      });
    }

    return sceneGraph;
  }

  /**
   * Convert Y.Map to plain object
   */
  yMapToObject(yMap) {
    if (!yMap || typeof yMap.entries !== "function") {
      return yMap;
    }
    const obj = {};
    for (const [key, value] of yMap.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Handle document update
   */
  handleDocUpdate(update, origin) {
    this.lastActivity = Date.now();

    // If origin is not from this instance, it's from another client
    if (origin !== INSTANCE_ID) {
      // Broadcast to all connected clients
      this.broadcastSync(update, origin);
    }
  }

  /**
   * Handle awareness update
   */
  handleAwarenessUpdate(changed, origin) {
    const update = Awareness.encodeAwarenessUpdate(
      this.awareness,
      Array.from(this.awareness.getStates().keys())
    );

    // Broadcast to local clients
    this.broadcastAwareness(update);

    // Broadcast to Redis for multi-instance sync
    redisClient.publishToRoom(this.roomId, {
      type: "awareness",
      instanceId: INSTANCE_ID,
      data: Buffer.from(update).toString("base64"),
    });
  }

  /**
   * Add client to room
   */
  addClient(ws, userId, userInfo = {}) {
    this.clients.set(ws, {
      userId,
      userInfo,
      connectedAt: Date.now(),
    });

    // Set awareness state
    const awarenessState = {
      user: {
        id: userId,
        name: userInfo.name || `User ${userId.slice(0, 6)}`,
        color: userInfo.color || this.generateUserColor(userId),
        ...userInfo,
      },
    };
    this.awareness.setLocalStateField(userId, awarenessState);

    // Store presence in Redis
    redisClient.setPresence(this.roomId, userId, awarenessState);

    // Send sync step 1 (state vector)
    this.sendSyncStep1(ws);

    // Send current awareness states
    this.sendAwareness(ws);

    this.lastActivity = Date.now();
  }

  /**
   * Remove client from room
   */
  removeClient(ws) {
    const client = this.clients.get(ws);
    if (client) {
      // Remove awareness state
      this.awareness.states.delete(client.userId);
      this.awareness.meta.delete(client.userId);

      // Remove from Redis
      redisClient.removePresence(this.roomId, client.userId);

      this.clients.delete(ws);
    }

    this.lastActivity = Date.now();

    // If no more clients, schedule cleanup
    if (this.clients.size === 0) {
      this.scheduleCleanup();
    }
  }

  /**
   * Handle message from client
   */
  handleMessage(ws, message) {
    this.lastActivity = Date.now();

    try {
      const data = new Uint8Array(message);
      const messageType = data[0];

      switch (messageType) {
        case MESSAGE_SYNC:
          this.handleSyncMessage(ws, data.slice(1));
          break;
        case MESSAGE_AWARENESS:
          this.handleAwarenessMessage(ws, data.slice(1));
          break;
        case MESSAGE_AUTH:
          // Auth handled at connection level
          break;
        default:
          console.warn(`Unknown message type: ${messageType}`);
      }
    } catch (err) {
      console.error("Error handling message:", err.message);
    }
  }

  /**
   * Handle sync message (Yjs protocol)
   */
  handleSyncMessage(ws, data) {
    try {
      const messageType = data[0];

      if (messageType === 0) {
        // Sync step 1: Client sends state vector, respond with diff
        const decoder = new Y.Decoder(data.slice(1));
        const stateVector = Y.readVarUint8Array(decoder);
        const encoder = new Y.Encoder();
        encoder.writeVarUint(0); // message type
        encoder.writeVarUint(1); // sync step 2
        const diff = Y.encodeStateAsUpdate(this.doc, stateVector);
        Y.writeVarUint8Array(encoder, diff);
        this.send(ws, new Uint8Array(encoder.toArrayBuffer()));
      } else if (messageType === 2) {
        // Sync step 2: Client applies diff
        const decoder = new Y.Decoder(data.slice(1));
        const update = Y.readVarUint8Array(decoder);
        Y.applyUpdate(this.doc, update, INSTANCE_ID);

        // Send sync step 2 complete
        const encoder = new Y.Encoder();
        encoder.writeVarUint(0); // message type
        encoder.writeVarUint(0); // sync step 1 (request)
        const stateVector = Y.encodeStateVector(this.doc);
        Y.writeVarUint8Array(encoder, stateVector);
        this.send(ws, new Uint8Array(encoder.toArrayBuffer()));
      }
    } catch (err) {
      console.error("Error handling sync message:", err.message);
    }
  }

  /**
   * Handle awareness message
   */
  handleAwarenessMessage(ws, data) {
    try {
      this.applyAwarenessUpdate(data, true);
    } catch (err) {
      console.error("Error handling awareness message:", err.message);
    }
  }

  /**
   * Apply awareness update
   */
  applyAwarenessUpdate(update, broadcast) {
    Awareness.applyAwarenessUpdate(this.awareness, update, null);

    if (broadcast) {
      this.broadcastAwareness(update);
    }
  }

  /**
   * Send sync step 1 (state vector) to client
   */
  sendSyncStep1(ws) {
    const encoder = new Y.Encoder();
    encoder.writeVarUint(MESSAGE_SYNC);
    encoder.writeVarUint(0); // sync step 1
    const stateVector = Y.encodeStateVector(this.doc);
    Y.writeVarUint8Array(encoder, stateVector);
    this.send(ws, new Uint8Array(encoder.toArrayBuffer()));
  }

  /**
   * Send awareness states to client
   */
  sendAwareness(ws) {
    const states = Array.from(this.awareness.getStates().keys());
    if (states.length === 0) return;

    const update = Awareness.encodeAwarenessUpdate(this.awareness, states);
    const encoder = new Y.Encoder();
    encoder.writeVarUint(MESSAGE_AWARENESS);
    encoder.writeVarUint8Array(update);
    this.send(ws, new Uint8Array(encoder.toArrayBuffer()));
  }

  /**
   * Broadcast sync update to all clients except origin
   */
  broadcastSync(update, origin) {
    const encoder = new Y.Encoder();
    encoder.writeVarUint(MESSAGE_SYNC);
    encoder.writeVarUint(2); // sync step 2
    Y.writeVarUint8Array(encoder, update);
    const message = new Uint8Array(encoder.toArrayBuffer());

    for (const [ws, client] of this.clients) {
      if (client.userId !== origin) {
        this.send(ws, message);
      }
    }
  }

  /**
   * Broadcast awareness to all clients
   */
  broadcastAwareness(update) {
    const encoder = new Y.Encoder();
    encoder.writeVarUint(MESSAGE_AWARENESS);
    encoder.writeVarUint8Array(update);
    const message = new Uint8Array(encoder.toArrayBuffer());

    for (const ws of this.clients.keys()) {
      this.send(ws, message);
    }
  }

  /**
   * Send message to WebSocket
   */
  send(ws, data) {
    if (ws.readyState === 1) {
      // WebSocket.OPEN
      try {
        ws.send(data);
      } catch (err) {
        console.error("Error sending message:", err.message);
      }
    }
  }

  /**
   * Start snapshot timer
   */
  startSnapshotTimer() {
    if (this.snapshotTimer) return;

    this.snapshotTimer = setInterval(() => {
      this.takeSnapshot();
    }, SNAPSHOT_INTERVAL_MS);
  }

  /**
   * Take snapshot and save to PostgreSQL
   */
  async takeSnapshot() {
    if (!this.isLoaded || this.destroyed) return;

    // Try to acquire lock
    const lockToken = await redisClient.acquireLock(
      this.roomId,
      "snapshot",
      30000
    );
    if (!lockToken) return; // Another instance is snapshotting

    try {
      const sceneGraph = this.toSceneGraph();
      await persistence.saveSceneGraph(this.siteId, this.version, sceneGraph);

      const now = Date.now();
      this.lastSnapshot = now;
      await redisClient.setLastSnapshotTime(this.roomId, now);

      console.log(`Snapshot saved for room ${this.roomId}`);
    } catch (err) {
      console.error("Error taking snapshot:", err.message);
    } finally {
      await redisClient.releaseLock(this.roomId, "snapshot", lockToken);
    }
  }

  /**
   * Schedule cleanup when room is empty
   */
  scheduleCleanup() {
    setTimeout(() => {
      if (this.clients.size === 0) {
        this.destroy();
      }
    }, DOC_TIMEOUT_MS);
  }

  /**
   * Compact and save final state
   */
  async compact() {
    if (!this.isLoaded) return;

    console.log(`Compacting room ${this.roomId}`);

    // Final snapshot
    await this.takeSnapshot();

    // Cleanup Redis
    await redisClient.unsubscribeFromRoom(this.roomId);
    await redisClient.cleanupPresences(this.roomId, 0);
  }

  /**
   * Destroy room
   */
  async destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }

    await this.compact();

    // Close all client connections
    for (const ws of this.clients.keys()) {
      try {
        ws.close(1000, "Room closing");
      } catch (err) {
        // Ignore
      }
    }
    this.clients.clear();

    this.doc.destroy();

    console.log(`Room ${this.roomId} destroyed`);
  }

  /**
   * Get room statistics
   */
  getStats() {
    return {
      roomId: this.roomId,
      siteId: this.siteId,
      version: this.version,
      clientCount: this.clients.size,
      isLoaded: this.isLoaded,
      lastActivity: this.lastActivity,
      lastSnapshot: this.lastSnapshot,
      destroyed: this.destroyed,
      awarenessStates: this.awareness.getStates().size,
    };
  }

  /**
   * Generate consistent color for user
   */
  generateUserColor(userId) {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}

/**
 * YjsServer manages all rooms
 */
class YjsServer {
  constructor() {
    this.rooms = new Map(); // Map<roomId, Room>
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 60000); // Every minute
  }

  /**
   * Get or create room
   */
  async getRoom(siteId, version) {
    const roomId = `${siteId}:${version}`;

    let room = this.rooms.get(roomId);
    if (!room || room.destroyed) {
      room = new Room(roomId, siteId, version);
      this.rooms.set(roomId, room);
      await room.load();
    }

    return room;
  }

  /**
   * Remove room
   */
  async removeRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      await room.destroy();
      this.rooms.delete(roomId);
    }
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(ws, siteId, version, userId, userInfo) {
    const room = await this.getRoom(siteId, version);

    if (room.destroyed) {
      ws.close(1011, "Room unavailable");
      return null;
    }

    room.addClient(ws, userId, userInfo);

    // Setup message handler
    ws.on("message", (message) => {
      room.handleMessage(ws, message);
    });

    // Setup close handler
    ws.on("close", () => {
      room.removeClient(ws);
    });

    // Setup error handler
    ws.on("error", (err) => {
      console.error(`WebSocket error in room ${room.roomId}:`, err.message);
      room.removeClient(ws);
    });

    return room;
  }

  /**
   * Cleanup inactive rooms
   */
  async cleanupInactiveRooms() {
    const now = Date.now();
    const toRemove = [];

    for (const [roomId, room] of this.rooms) {
      if (room.destroyed) {
        toRemove.push(roomId);
      } else if (room.clients.size === 0 && now - room.lastActivity > DOC_TIMEOUT_MS) {
        toRemove.push(roomId);
      }
    }

    for (const roomId of toRemove) {
      await this.removeRoom(roomId);
    }

    if (toRemove.length > 0) {
      console.log(`Cleaned up ${toRemove.length} inactive rooms`);
    }
  }

  /**
   * Get all room stats
   */
  getStats() {
    const stats = {
      totalRooms: this.rooms.size,
      rooms: [],
    };

    for (const room of this.rooms.values()) {
      stats.rooms.push(room.getStats());
    }

    return stats;
  }

  /**
   * Get stats for specific room
   */
  getRoomStats(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.getStats() : null;
  }

  /**
   * Shutdown server
   */
  async shutdown() {
    clearInterval(this.cleanupInterval);

    // Save all rooms
    for (const room of this.rooms.values()) {
      await room.compact();
    }

    this.rooms.clear();
  }
}

// Singleton instance
const yjsServer = new YjsServer();

module.exports = { Room, YjsServer, yjsServer };
