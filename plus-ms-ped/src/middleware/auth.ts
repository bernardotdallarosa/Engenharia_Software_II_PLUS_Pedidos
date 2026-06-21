import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type JwtClaims = {
  sub: string;
  user_id?: number;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtClaims;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", details: ["Missing bearer token"] });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: "internal_error", details: ["JWT secret not configured"] });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtClaims;

    if (!payload.sub || !payload.role) {
      res.status(401).json({ error: "unauthorized", details: ["Invalid token claims"] });
      return;
    }

    req.user = {
      sub: payload.sub,
      user_id: payload.user_id,
      role: payload.role,
    };
    next();
  } catch (_error) {
    res.status(401).json({ error: "unauthorized", details: ["Invalid token"] });
  }
};
