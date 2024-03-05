import express from "express";
const router =  express.Router();

import { JpgTopdf } from "../controllers/jpgToPdfconverterController.js";
import { PngTopdf } from "../controllers/pngToPdfconvertorController.js";
import { pngTojpg } from "../controllers/pngTojpgConvertController.js";
import { pngcompressor } from "../controllers/pngCompressorController.js";
import { jpgTowebp } from "../controllers/jpgTowebpConverterController.js";
import { pngTowebp } from "../controllers/pngTowebpConverterController.js";
import { webpTojpg } from "../controllers/webpTojpgConverterController.js";



router.post("/jpgTopdf/",JpgTopdf)
router.post("/pngTopdf/", PngTopdf)
router.post("/pngTojpg/",pngTojpg)
router.post("/pngcompressor/", pngcompressor)
router.post("/jpgtowebp/",jpgTowebp)
router.post("/pngtowebp/",pngTowebp)
router.post("/webptojpg/", webpTojpg)
export default router;