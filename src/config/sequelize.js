import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import logger from '../lib/logger';
import settings from './settings';

const logStream = fs.createWriteStream(path.join(__dirname, '../../', 'logs', 'queries.log'), { flags: 'a' });
const sequelize = new Sequelize(settings.dbConnectionString, {
    // logging: false, // disable logging
    logging: (query) => {
        if (process.env.NODE_ENV != 'production' && process.env.NODE_ENV != 'test') {
            logger.debug(query);
        } else {
            logStream.write(`[${new Date().toISOString()}] ${query}\n`);
        }
    },
});

export default sequelize;
