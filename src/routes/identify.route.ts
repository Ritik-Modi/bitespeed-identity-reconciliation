import { Router } from "express";
import { identifyController } from "../controllers/identify.controller";
import { validateIdentifyRequest } from "../middlewares/validation.middleware";

const identifyRouter = Router();

identifyRouter.post("/identify", validateIdentifyRequest, identifyController);

export { identifyRouter };
