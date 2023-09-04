import { Schema, model } from "mongoose";

const ticketSchema = new Schema(
  {
    status: {
      type: String,
      required: false,
    },
    idTicket: {
      type: String,
      unique: true
    },
    otherProps : {}
  },
  {
    strict: false,
  }
);

const ticketModel = model('tickets', ticketSchema);
export default ticketModel;
