import { createLogger, format, transports } from 'winston';
import path from 'path';

const LOGS_FILE = path.resolve(__dirname, '../../', 'logs', 'server.log');
const ERROR_LOGS_FILE = path.resolve(__dirname, '../../', 'logs', 'error.log');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.simple()
        // format.json()
    ),
    transports: [
        process.env.NODE_ENV !== 'production' &&
            new transports.Console({
                level: 'debug',
                handleExceptions: true,
                format: format.combine(
                    format.colorize(),
                    format.label({
                        label: '[LOGGER]',
                    }),
                    format.timestamp({
                        format: 'YY-MM-DD HH:MM:SS',
                    }),
                    format.printf((info) => {
                        const level = info.level.replace(/(info|error|warn|debug)/gi, (match) => match.toUpperCase());
                        return `${info.label} ${info.timestamp} ${level}: ${info.message}`;
                    })
                ),
            }),
        new transports.File({ filename: ERROR_LOGS_FILE, level: 'error' }),
        new transports.File({ filename: LOGS_FILE }),
    ].filter(Boolean),
});

export default logger;
