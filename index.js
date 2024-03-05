
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import allroutes from "./routes/allroutes.js";
import cron from 'node-cron';
const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(fileUpload()); 
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));



app.use(cors());

app.use("/converter-api/v1/action/",allroutes )


app.listen(8040, () => {
  console.log("Connected to backend");
});



