import 'dotenv/config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const VALID_LOG_LEVELS: readonly LogLevel[] = ['error', 'warn', 'info', 'debug'] as const;

function parseLogLevel(value: string | undefined): LogLevel {
  if (value && VALID_LOG_LEVELS.includes(value as LogLevel)) {
    return value as LogLevel;
  }
  return 'info';
}

interface Limits {
  maxPayload: number;
  maxConnsPerIp: number;
  maxGlobalConns: number;
  maxConnRatePerMin: number;
  maxMsgRatePerSec: number;
  memoryThreshold: number; // Percentage of heap used (0-1)
}

interface Config {
  port: number;
  host: string;
  corsOrigins: string[];
  logLevel: LogLevel;
  roomCleanupInterval: number;
  roomInactiveTimeout: number;
  limits: Limits;
}

const config: Config = {
  port: parseInt(process.env.PORT || '1234', 10),
  host: process.env.HOST || '0.0.0.0',

  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['http://localhost:3000'],

  logLevel: parseLogLevel(process.env.LOG_LEVEL),

  roomCleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL || '300000', 10),
  roomInactiveTimeout: parseInt(process.env.ROOM_INACTIVE_TIMEOUT || '3600000', 10),

  limits: {
    maxPayload: parseInt(process.env.MAX_PAYLOAD || '5242880', 10),
    maxConnsPerIp: parseInt(process.env.MAX_CONNS_PER_IP || '100', 10),
    maxGlobalConns: parseInt(process.env.MAX_GLOBAL_CONNS || '10000', 10),
    maxConnRatePerMin: parseInt(process.env.MAX_CONN_RATE_PER_MIN || '100', 10),
    maxMsgRatePerSec: parseInt(process.env.MAX_MSG_RATE_PER_SEC || '100', 10),
    memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD || '0.8'),
  },
};

if (Number.isNaN(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}. Must be between 1 and 65535.`);
}

if (Number.isNaN(config.roomCleanupInterval) || config.roomCleanupInterval <= 0) {
  throw new Error(`Invalid ROOM_CLEANUP_INTERVAL: ${process.env.ROOM_CLEANUP_INTERVAL}. Must be a positive number (milliseconds).`);
}

if (Number.isNaN(config.roomInactiveTimeout) || config.roomInactiveTimeout <= 0) {
  throw new Error(`Invalid ROOM_INACTIVE_TIMEOUT: ${process.env.ROOM_INACTIVE_TIMEOUT}. Must be a positive number (milliseconds).`);
}

if (config.limits.maxPayload <= 0 || Number.isNaN(config.limits.maxPayload)) {
  throw new Error(`Invalid MAX_PAYLOAD: ${process.env.MAX_PAYLOAD}. Must be a positive number.`);
}

if (config.limits.maxConnsPerIp <= 0 || Number.isNaN(config.limits.maxConnsPerIp)) {
  throw new Error(`Invalid MAX_CONNS_PER_IP: ${process.env.MAX_CONNS_PER_IP}. Must be a positive number.`);
}

if (config.limits.maxGlobalConns <= 0 || Number.isNaN(config.limits.maxGlobalConns)) {
  throw new Error(`Invalid MAX_GLOBAL_CONNS: ${process.env.MAX_GLOBAL_CONNS}. Must be a positive number.`);
}

if (config.limits.maxConnRatePerMin <= 0 || Number.isNaN(config.limits.maxConnRatePerMin)) {
  throw new Error(`Invalid MAX_CONN_RATE_PER_MIN: ${process.env.MAX_CONN_RATE_PER_MIN}. Must be a positive number.`);
}

if (config.limits.maxMsgRatePerSec <= 0 || Number.isNaN(config.limits.maxMsgRatePerSec)) {
  throw new Error(`Invalid MAX_MSG_RATE_PER_SEC: ${process.env.MAX_MSG_RATE_PER_SEC}. Must be a positive number.`);
}

if (Number.isNaN(config.limits.memoryThreshold) || config.limits.memoryThreshold <= 0 || config.limits.memoryThreshold > 1) {
    throw new Error(`Invalid MEMORY_THRESHOLD: ${process.env.MEMORY_THRESHOLD}. Must be between 0 and 1.`);
}

export default config;
