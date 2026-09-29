import express from "express";
import { middlewareLogResponses } from './middleware/logging.js';
import { middlewareMetricsInc } from "./middleware/MetricsInc.js";
import { handlerReadiness } from "./handler/health.js";
import { handlerResetRequestsCount, handlerWriteRequestsCount } from "./handler/metrics.js";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - core

const PORT = 8080;
const app = express();

app.use(middlewareLogResponses);
app.use('/app', middlewareMetricsInc, express.static("./src/app"));


app.get("/healthz", handlerReadiness);
app.get("/metrics", handlerWriteRequestsCount);
app.get("/reset", handlerResetRequestsCount);



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});