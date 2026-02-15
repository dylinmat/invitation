const http = require("http");
const { URL } = require("url");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("crypto");

const { yjsServer } = require("./yjs-server");
const { redisClient } = require("./redis-client");
const { persistence } = require("./persistence");

// Configuration
const PORT = Number.parseInt(process.env.PORT, 10) || 4100;
const RATE_LIMIT_PER_ROOM = Number.parseInt(
  process.env.RATE_LIMIT_PER_ROOM || "100",
  10
);
const RATE_LIMIT_WINDOW_MS = Number.parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "60000",
  10
);

// Rate limiting storage (in-memory, per instance)
const rateLimitMap = new Map(); // Map<roomId:ip, {count, resetTime}>

/**
 * Check rate limit for a room + IP
 */
function checkRateLimit(roomId, ip) {
  const key = `${roomId}:${ip}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_PER_ROOM - 1 };
  }

  if (entry.count >= RATE_LIMIT_PER_ROOM) {
    return { allowed: false, remaining: 0, retryAfter: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_PER_ROOM - entry.count };
}

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

/**
 * Parse room ID from URL pathname
 * Format: /ws/:siteId/:version
 */
function parseRoomPath(pathname) {
  const match = pathname.match(/^\/ws\/([^/]+)\/([^/]+)$/);
  if (!match) return null;

  return {
    siteId: match[1],
    version: match[2],
  };
}

/**
 * Extract user info from query params
 */
function extractUserInfo(url) {
  const userId = url.searchParams.get("userId") || uuidv4();
  const userName = url.searchParams.get("name") || "Anonymous";
  const userColor = url.searchParams.get("color");

  return {
    userId,
    userInfo: {
      name: userName,
      color: userColor,
    },
  };
}

/**
 * Send JSON response
 */
function respondJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Health check - check all dependencies
 */
async function healthCheck() {
  const checks = {
    server: true,
    database: false,
    redis: false,
  };

  try {
    checks.database = await persistence.healthCheck();
  } catch (err) {
    console.error("Health check - database failed:", err.message);
  }

  try {
    await redisClient.client.ping();
    checks.redis = true;
  } catch (err) {
    console.error("Health check - redis failed:", err.message);
  }

  const healthy = checks.database && checks.redis;
  return { status: healthy ? "ok" : "degraded", checks };
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (url.pathname === "/health") {
    const health = await healthCheck();
    const statusCode = health.checks.database && health.checks.redis ? 200 : 503;
    return respondJson(res, statusCode, health);
  }

  // Ready check endpoint
  if (url.pathname === "/ready") {
    const health = await healthCheck();
    const ready = health.checks.database && health.checks.redis;
    return respondJson(res, ready ? 200 : 503, {
      status: ready ? "ready" : "not_ready",
      checks: health.checks,
    });
  }

  // Room stats endpoint
  if (url.pathname.startsWith("/rooms/") && url.pathname.endsWith("/stats")) {
    const parts = url.pathname.split("/");
    if (parts.length === 4) {
      const roomId = parts[2];
      const stats = yjsServer.getRoomStats(roomId);
      const redisStats = await redisClient.getRoomStats(roomId);

      if (!stats) {
        return respondJson(res, 404, {
          error: "Room not found",
          roomId,
          redisStats,
        });
      }

      return respondJson(res, 200, {
        ...stats,
        redis: redisStats,
      });
    }
  }

  // All rooms stats (admin/debug)
  if (url.pathname === "/rooms") {
    const stats = yjsServer.getStats();
    return respondJson(res, 200, stats);
  }

  // Root endpoint
  if (url.pathname === "/") {
    return respondJson(res, 200, {
      name: "Event Invitation OS Realtime",
      version: "1.0.0",
      features: ["yjs", "websocket", "presence", "persistence"],
      endpoints: {
        websocket: "/ws/:siteId/:version",
        health: "/health",
        ready: "/ready",
        rooms: "/rooms",
        roomStats: "/rooms/:roomId/stats",
      },
    });
  }

  // 404 for everything else
  return respondJson(res, 404, { error: "Not found" });
});

// Handle WebSocket upgrade
server.on("upgrade", async (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Parse room path
  const roomInfo = parseRoomPath(pathname);
  if (!roomInfo) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  const { siteId, version } = roomInfo;
  const roomId = `${siteId}:${version}`;

  // Get client IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;

  // Check rate limit
  const rateLimit = checkRateLimit(roomId, ip);
  if (!rateLimit.allowed) {
    socket.write(
      `HTTP/1.1 429 Too Many Requests\r\n` +
        `Retry-After: ${Math.ceil(rateLimit.retryAfter / 1000)}\r\n\r\n`
    );
    socket.destroy();
    return;
  }

  // Extract user info
  const { userId, userInfo } = extractUserInfo(url);

  console.log(
    `WebSocket upgrade: room=${roomId}, user=${userId}, ip=${ip}`
  );

  // Create WebSocket server for this connection
  const wss = new WebSocket.Server({ noServer: true });

  wss.on("connection", async (ws) => {
    try {
      // Increment connection count in Redis
      await redisClient.incrementConnection(roomId, ip);

      // Handle connection in Yjs server
      const room = await yjsServer.handleConnection(
        ws,
        siteId,
        version,
        userId,
        userInfo
      );

      if (!room) {
        ws.close(1011, "Failed to join room");
        return;
      }

      console.log(
        `Client connected: room=${roomId}, user=${userId}, clients=${room.clients.size}`
      );

      // Handle close to decrement connection count
      ws.on("close", async () => {
        await redisClient.decrementConnection(roomId, ip);
        console.log(
          `Client disconnected: room=${roomId}, user=${userId}, clients=${
            room.clients.size - 1
          }`
        );
      });
    } catch (err) {
      console.error(`Error handling WebSocket connection:`, err.message);
      ws.close(1011, "Internal error");
    }
  });

  // Complete the upgrade
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  // Close HTTP server (stop accepting new connections)
  server.close(() => {
    console.log("HTTP server closed");
  });

  // Shutdown Yjs server (save all rooms)
  await yjsServer.shutdown();
  console.log("Yjs server shutdown complete");

  // Close Redis connections
  await redisClient.close();
  console.log("Redis connections closed");

  // Close PostgreSQL pool
  await persistence.close();
  console.log("PostgreSQL pool closed");

  console.log("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Start server
server.listen(PORT, () => {
  console.log(`EIOS Realtime server listening on :${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws/:siteId/:version`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = { server };
