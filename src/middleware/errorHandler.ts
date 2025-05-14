// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
};
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
};