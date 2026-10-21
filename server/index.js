import 'dotenv/config';
import app from './app.js';
import logger from './logger.js';
import { startBackupSchedule } from './backup.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';

startBackupSchedule();

app.listen(PORT, HOST, () => {
  logger.info('server started', {
    host: HOST,
    port: Number(PORT),
    env: process.env.NODE_ENV || 'development',
  });
});
