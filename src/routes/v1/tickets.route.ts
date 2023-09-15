import { Router } from "express";
import ticketsController from "../../controllers/v2/tickets.controller";

const ticketRouter = Router();

const { getAll, upload } = ticketsController;

ticketRouter
  .get("/all", getAll)
  .post("/v2/upload", upload);

export { ticketRouter };
