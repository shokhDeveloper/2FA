const winston = require('winston');
require("winston-mongodb");

const {timestamp, colorize, combine, printf} = winston.format;

const transportOptions = {
    db: process.env.dbUri,
    collection: "logs",
    level: "error"
}

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: 'src/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'src/logs/combined.log' }),
    new winston.transports.File({ filename: "src/logs/warning.log", level: "warn"}),
    new winston.transports.MongoDB(transportOptions)
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
        colorize({all: true}),
        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        printf(({level, message, timestamp}) => {
            return `${level}: ${message} ${timestamp}`
        })
    ),
  }));
};

module.exports = logger