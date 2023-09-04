import express from "express";
import router from "./routes";
import uploadFile from "express-fileupload";
import DB from "./utils/MongoDB";

const app = express();

app.use(express.json());
app.use(
  uploadFile({
    useTempFiles: true,
    tempFileDir: "./src/assets/tmp/",
  })
);

app.use("/api", router);

app.listen(4000, () => {
  console.log("Server iniciado");
  DB();
});
