import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/roomRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { initializeSockets } from './sockets/index.js';
import { roomStore } from './memory/roomStore.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const INACTIVITY_TIMEOUT_MS = parseInt(process.env.INACTIVITY_TIMEOUT_MS) || 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS) || 30 * 1000; // 30 seconds

const app = express();
const server = http.createServer(app);

// Dynamic CORS to support localhost, Vercel, Netlify, Render and custom domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or any web client origin
    callback(null, true);
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true
};

// Socket.IO Server configuration
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 30000,
  pingInterval: 10000,
  maxHttpBufferSize: 25 * 1024 * 1024 // 25MB buffer for 5-second video sharing
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimiter({ max: 120, windowMs: 60000 }));

// REST API Endpoints
app.use('/api/rooms', roomRoutes);
app.use('/api/health', healthRoutes);

// Socket Handlers
initializeSockets(io);

// Inactive Room Watchdog
const cleanupTimer = setInterval(() => {
  const destroyed = roomStore.cleanupInactiveRooms(INACTIVITY_TIMEOUT_MS);
  if (destroyed.length > 0) {
    console.log(`[Watchdog] Cleaned up ${destroyed.length} inactive room(s): ${destroyed.join(', ')}`);
  }
}, CLEANUP_INTERVAL_MS);

// Error handling middleware
app.use(errorHandler);

// Server startup & error events
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already occupied by another process.`);
    console.error(`👉 Close the process using port ${PORT} or restart nodemon.\n`);
  } else {
    console.error('\n❌ Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🔥 Aaj Ka Kalesh Server Live on port ${PORT}`);
  console.log(`🔒 ARCHITECTURE: STRICT ZERO DATABASE`);
  console.log(`🧹 Inactivity timeout: ${INACTIVITY_TIMEOUT_MS / 60000} mins`);
  console.log(`🌐 Ready for WebRTC signaling & real-time kalesh`);
  console.log(`=================================================\n`);
});

// Graceful shutdown
function handleShutdown() {
  console.log('\n[Kalesh Server] Shutting down... Wiping all memory state.');
  clearInterval(cleanupTimer);
  roomStore.rooms.clear();
  roomStore.socketToRoom.clear();
  server.close(() => {
    console.log('[Kalesh Server] Memory wiped. Process terminated.');
    process.exit(0);
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
