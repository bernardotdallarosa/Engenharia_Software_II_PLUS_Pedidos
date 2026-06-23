import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sign } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { authenticate } from "../src/middleware/auth";

const makeRes = () => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as Response & { statusCode: number; body: unknown };
};

describe("authenticate middleware", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("rejeita pedido sem Authorization", () => {
    const req = { headers: {} } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejeita token inválido", () => {
    const req = { headers: { authorization: "Bearer invalid" } } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("retorna 500 se JWT_SECRET não estiver configurado", () => {
    delete process.env.JWT_SECRET;
    const token = sign({ sub: "a@b.com", role: "admin" }, "other-secret");
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejeita token sem claims obrigatórios", () => {
    const token = sign({ sub: "admin@example.com" }, "test-secret");
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("aceita token válido e preenche req.user", () => {
    const token = sign({ sub: "admin@example.com", role: "admin", user_id: 1 }, "test-secret");
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({
      sub: "admin@example.com",
      role: "admin",
      user_id: 1,
    });
  });
});
