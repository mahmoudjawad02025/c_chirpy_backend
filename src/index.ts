import express from "express";
import { middlewareLogResponses } from './middleware/logging.js';
import { middlewareMetricsInc } from "./middleware/MetricsInc.js";
import { handlerReadiness } from "./handler/health.js";
import { handlerResetRequestsCount, handlerWriteRequestsCount } from "./handler/metrics.js";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - core

const PORT = 8080;
const app = express();
const apiPath = "/api";
const appPath = "/app";
const adminPath = "/admin";

app.use(middlewareLogResponses);
app.use(appPath, middlewareMetricsInc, express.static("./src/app"));


app.get(apiPath + "/healthz", handlerReadiness);
app.get(adminPath + "/metrics", handlerWriteRequestsCount);
app.get(adminPath + "/reset", handlerResetRequestsCount);



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});