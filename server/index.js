import 'dotenv/config';
import app from './app.js';
import logger from './logger.js';
import { startBackupSchedule } from './backup.js';

const PORT = process.env.PORT || 3001;

startBackupSchedule();

app.listen(PORT, () => {
  logger.info('server started', { port: Number(PORT), env: process.env.NODE_ENV || 'development' });
});
