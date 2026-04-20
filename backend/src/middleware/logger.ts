import { Request, Response, NextFunction } from "express";

export function logger(req: Request, _res: Response, next: NextFunction) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.path}`);
  next();
}
