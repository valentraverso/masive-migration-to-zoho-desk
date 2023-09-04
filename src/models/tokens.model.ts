import { Schema, model } from "mongoose";

const tokenSchema = new Schema(
  {
    type_token: {
      type: String,
      required: false,
    },
  },
  {
    strict: false,
  }
);

const tokenModel = model('tokens', tokenSchema);
export default tokenModel;