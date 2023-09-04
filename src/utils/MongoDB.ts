import { MONGO_URI } from "../config/config";
import mongoose from "mongoose";

function getDatabase() {
  try {
    mongoose.connect(MONGO_URI).then(() => {
      console.log("Connected to dabase");
    });
  } catch (err: any) {
    console.error(err.message);
  }
}

export default getDatabase;
