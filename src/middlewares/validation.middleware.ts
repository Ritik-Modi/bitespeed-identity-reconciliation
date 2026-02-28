import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";

export function validateIdentifyRequest(req: Request, _res: Response, next: NextFunction): void {
  if (!isValidOptionalString(req.body.email) || !isValidOptionalString(req.body.phoneNumber)) {
    return next(new HttpError(400, "email and phoneNumber must be strings when provided."));
  }

  const email = normalizeOptionalString(req.body.email);
  const phoneNumber = normalizeOptionalString(req.body.phoneNumber);

  if (!email && !phoneNumber) {
    return next(new HttpError(400, "At least one of email or phoneNumber must be provided."));
  }

  req.body.email = email;
  req.body.phoneNumber = phoneNumber;

  next();
}

function isValidOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
