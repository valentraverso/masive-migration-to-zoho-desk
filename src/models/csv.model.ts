import { Schema, model } from "mongoose";

const csvSchema = new Schema(
  {
    idCsv: {
      type: Number,
      required: false
    },
    "Brand name": {
      type: String,
    },
    otherProps: {},
  },
  {
    strict: false,
  }
);

const csvModel = model("csvs", csvSchema);
export default csvModel;
