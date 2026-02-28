import express from "express";
import { identifyRouter } from "./routes/identify.route";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

app.use(express.json());
app.use("/", identifyRouter);
app.use(errorMiddleware);
