import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import roomRoutes from './routes/roomRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import recordingRoutes from './routes/recordingRoutes.js';
import { connectDB } from './config/db.js';
import { initializeSockets } from './sockets/index.js';
import { roomStore } from './memory/roomStore.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// Initialize MongoDB / Database layer
connectDB();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const INACTIVITY_TIMEOUT_MS = parseInt(process.env.INACTIVITY_TIMEOUT_MS) || 60 * 60 * 1000; // 60 minutes
const EMPTY_ROOM_GRACE_MS = parseInt(process.env.EMPTY_ROOM_GRACE_MS) || 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS) || 60 * 1000; // 60 seconds

const app = express();
const server = http.createServer(app);

// Dynamic CORS to support localhost, Vercel, Netlify, Render and custom domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or any web client origin
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

// Socket.IO Server configuration
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 30000,
  pingInterval: 10000,
  maxHttpBufferSize: 25 * 1024 * 1024 // 25MB buffer
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimiter({ max: 120, windowMs: 60000 }));

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/health', healthRoutes);

// Socket Handlers
initializeSockets(io);

// Inactive Room Watchdog
const cleanupTimer = setInterval(() => {
  const destroyed = roomStore.cleanupInactiveRooms(INACTIVITY_TIMEOUT_MS, EMPTY_ROOM_GRACE_MS);
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
  console.log(`🔥 Aaj Ka Kalesh / MeetHub Server Live on port ${PORT}`);
  console.log(`🌐 Ready for WebRTC signaling & real-time sessions`);
  console.log(`🧹 Inactivity timeout: ${INACTIVITY_TIMEOUT_MS / 60000} mins`);
  console.log(`=================================================\n`);
});

// Graceful shutdown
let isShuttingDown = false;
function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Kalesh Server] Shutting down (${signal || 'signal'})... Wiping all memory state.`);
  clearInterval(cleanupTimer);
  roomStore.rooms.clear();
  roomStore.socketToRoom.clear();
  server.close(() => {
    console.log('[Kalesh Server] Memory wiped. Process terminated.');
    process.exit(0);
  });
  // Force exit after 3s if active sockets delay server.close
  setTimeout(() => {
    process.exit(0);
  }, 3000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[Kalesh Server] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Kalesh Server] Uncaught Exception:', err);
});

