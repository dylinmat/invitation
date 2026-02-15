const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${Date.now()}`;

// Redis clients for different purposes
class RedisClient {
  constructor() {
    // Main Redis client for presence and data
    this.client = new Redis(REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // Pub/sub client for broadcasting
    this.pubClient = new Redis(REDIS_URL);
    this.subClient = new Redis(REDIS_URL);

    // Event handlers
    this.client.on("error", (err) => {
      console.error("Redis client error:", err.message);
    });

    this.pubClient.on("error", (err) => {
      console.error("Redis pub client error:", err.message);
    });

    this.subClient.on("error", (err) => {
      console.error("Redis sub client error:", err.message);
    });

    this.subClient.on("connect", () => {
      console.log("Redis subscriber connected");
    });

    // Message handlers for pub/sub
    this.messageHandlers = new Map();
    this.setupSubscription();
  }

  setupSubscription() {
    this.subClient.on("message", (channel, message) => {
      const handler = this.messageHandlers.get(channel);
      if (handler) {
        try {
          const parsed = JSON.parse(message);
          handler(parsed);
        } catch (err) {
          handler(message);
        }
      }
    });
  }

  /**
   * Get Redis key with collaboration prefix
   */
  getKey(roomId, suffix) {
    return `collab:${roomId}:${suffix}`;
  }

  /**
   * Store user presence in a room
   */
  async setPresence(roomId, userId, presence) {
    const key = this.getKey(roomId, "presence");
    const data = JSON.stringify({
      ...presence,
      userId,
      timestamp: Date.now(),
      instanceId: INSTANCE_ID,
    });
    await this.client.hset(key, userId, data);
    // Set expiration for cleanup
    await this.client.expire(key, 86400); // 24 hours
  }

  /**
   * Get all presences in a room
   */
  async getPresences(roomId) {
    const key = this.getKey(roomId, "presence");
    const presences = await this.client.hgetall(key);
    const result = {};
    for (const [userId, data] of Object.entries(presences)) {
      try {
        result[userId] = JSON.parse(data);
      } catch {
        result[userId] = data;
      }
    }
    return result;
  }

  /**
   * Remove user presence from a room
   */
  async removePresence(roomId, userId) {
    const key = this.getKey(roomId, "presence");
    await this.client.hdel(key, userId);
  }

  /**
   * Clean up old presences for a room
   */
  async cleanupPresences(roomId, maxAgeMs = 300000) {
    const key = this.getKey(roomId, "presence");
    const presences = await this.client.hgetall(key);
    const now = Date.now();
    const toDelete = [];

    for (const [userId, data] of Object.entries(presences)) {
      try {
        const parsed = JSON.parse(data);
        if (now - parsed.timestamp > maxAgeMs) {
          toDelete.push(userId);
        }
      } catch {
        toDelete.push(userId);
      }
    }

    if (toDelete.length > 0) {
      await this.client.hdel(key, ...toDelete);
    }

    return toDelete.length;
  }

  /**
   * Publish message to room channel
   */
  async publishToRoom(roomId, message) {
    const channel = this.getKey(roomId, "broadcast");
    const data = typeof message === "string" ? message : JSON.stringify(message);
    await this.pubClient.publish(channel, data);
  }

  /**
   * Subscribe to room channel
   */
  async subscribeToRoom(roomId, handler) {
    const channel = this.getKey(roomId, "broadcast");
    this.messageHandlers.set(channel, handler);
    await this.subClient.subscribe(channel);
  }

  /**
   * Unsubscribe from room channel
   */
  async unsubscribeFromRoom(roomId) {
    const channel = this.getKey(roomId, "broadcast");
    this.messageHandlers.delete(channel);
    await this.subClient.unsubscribe(channel);
  }

  /**
   * Increment connection count for rate limiting
   */
  async incrementConnection(roomId, ip) {
    const key = this.getKey(roomId, `conn:${ip}`);
    const count = await this.client.incr(key);
    await this.client.pexpire(key, 60000); // 1 minute window
    return count;
  }

  /**
   * Decrement connection count
   */
  async decrementConnection(roomId, ip) {
    const key = this.getKey(roomId, `conn:${ip}`);
    const count = await this.client.decr(key);
    if (count <= 0) {
      await this.client.del(key);
    }
    return Math.max(0, count);
  }

  /**
   * Get connection count for rate limiting
   */
  async getConnectionCount(roomId, ip) {
    const key = this.getKey(roomId, `conn:${ip}`);
    const count = await this.client.get(key);
    return parseInt(count || "0", 10);
  }

  /**
   * Store last snapshot timestamp
   */
  async setLastSnapshotTime(roomId, timestamp) {
    const key = this.getKey(roomId, "last_snapshot");
    await this.client.set(key, timestamp.toString());
  }

  /**
   * Get last snapshot timestamp
   */
  async getLastSnapshotTime(roomId) {
    const key = this.getKey(roomId, "last_snapshot");
    const value = await this.client.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Lock room for snapshot/compaction
   */
  async acquireLock(roomId, lockName, ttlMs = 30000) {
    const key = this.getKey(roomId, `lock:${lockName}`);
    const token = `${INSTANCE_ID}:${Date.now()}`;
    const acquired = await this.client.set(key, token, "PX", ttlMs, "NX");
    return acquired === "OK" ? token : null;
  }

  /**
   * Release lock
   */
  async releaseLock(roomId, lockName, token) {
    const key = this.getKey(roomId, `lock:${lockName}`);
    const current = await this.client.get(key);
    if (current === token) {
      await this.client.del(key);
      return true;
    }
    return false;
  }

  /**
   * Get room statistics
   */
  async getRoomStats(roomId) {
    const presenceKey = this.getKey(roomId, "presence");
    const presences = await this.client.hlen(presenceKey);
    const lastSnapshot = await this.getLastSnapshotTime(roomId);

    return {
      roomId,
      activeUsers: presences,
      lastSnapshot,
      instanceId: INSTANCE_ID,
    };
  }

  /**
   * Close all connections
   */
  async close() {
    await this.client.quit();
    await this.pubClient.quit();
    await this.subClient.quit();
  }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = { RedisClient, redisClient, INSTANCE_ID };
