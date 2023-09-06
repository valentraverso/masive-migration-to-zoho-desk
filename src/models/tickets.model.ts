import { Schema, model } from "mongoose";

const ticketSchema = new Schema(
  {
    status: {
      type: String,
      required: false,
    },
    idTicket: {
      type: Number
    },
    otherProps : {}
  },
  {
    strict: false,
    saveErrorIfNotFound: true
  }
);

const ticketModel = model('jsons', ticketSchema);
export default ticketModel;
