import express from 'express';
import { roomStore } from '../memory/roomStore.js';
import { getDbInfo } from '../config/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const stats = roomStore.getStats();
  const memUsage = process.memoryUsage();
  const dbInfo = getDbInfo();

  res.json({
    status: 'ok',
    app: 'Aaj Ka Kalesh 🔥',
    tagline: 'Dosti kam, Kalesh zyada.',
    database: dbInfo.engine,
    databaseConnected: dbInfo.connected,
    databaseStatus: dbInfo.status,
    databaseHost: dbInfo.host,
    databaseName: dbInfo.name,
    uptime: Math.round(process.uptime()),
    stats: {
      activeRooms: stats.activeRooms,
      connectedParticipants: stats.totalParticipants
    },
    memory: {
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024)
    }
  });
});

export default router;
