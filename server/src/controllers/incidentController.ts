import { Request, Response, NextFunction } from "express";

export const createIncident = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body as { name: string };
    const newItem = { id: Date.now(), name };
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};
