import { Request, Response, NextFunction } from "express";
import { IdentityService } from "../services/identity.service";
import { IdentifyRequestBody } from "../types/contact.types";

const identityService = new IdentityService();

export async function identifyController(
  req: Request<unknown, unknown, IdentifyRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await identityService.identify({
      email: req.body.email,
      phoneNumber: req.body.phoneNumber
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
