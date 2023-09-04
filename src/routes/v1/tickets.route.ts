import { Router } from "express";
import ticketsController from "../../controllers/tickets.controller";

const ticketRouter = Router();

const { getAll, uploadJSON, uploadCSV, uploadAttachments, uploadComments } = ticketsController;

ticketRouter
.get("/all", getAll)
.post("/upload/json", uploadJSON)
.post("/upload/csv", uploadCSV)
.post("/upload/attachments", uploadAttachments)
.post("/upload/comments", uploadComments)

export { ticketRouter };
