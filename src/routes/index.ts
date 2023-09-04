import express from 'express';
import { ticketRouter } from "./v1";

const app = express();

app.use("/tickets", ticketRouter);

export default app;