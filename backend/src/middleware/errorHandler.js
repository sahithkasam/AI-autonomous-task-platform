import { logger } from '../utils/logger.js';
export const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: Object.values(err.errors).map(e => e.message) });
  }
  if (err.code === 11000) return res.status(400).json({ error: `${Object.keys(err.keyValue)[0]} already exists` });
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid ID format' });
  res.status(err.statusCode || 500).json({ error: err.isOperational ? err.message : 'Internal server error' });
};
export class AppError extends Error {
  constructor(message, statusCode) { super(message); this.statusCode = statusCode; this.isOperational = true; }
}
