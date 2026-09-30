import express from "express";
import { middlewareLogResponses } from './middleware/logging.js';
import { middlewareMetricsInc } from "./middleware/MetricsInc.js";
import { handlerReadiness } from "./handler/health.js";
import { handlerResetRequestsCount, handlerWriteRequestsCount } from "./handler/metrics.js";
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json' with { type: "json" };
import { handlerValidateChirp } from "./handler/chirps.js";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - core


const PORT = 8080;
const apiPath = "/api";
const appPath = "/app";
const adminPath = "/admin";
const app = express();


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(middlewareLogResponses);
app.use(appPath, middlewareMetricsInc, express.static("./src/app"));
app.use(express.json()); // Built-in JSON body parsing middleware


app.get(apiPath + "/healthz", handlerReadiness);
app.get(adminPath + "/metrics", handlerWriteRequestsCount);
app.post(adminPath + "/reset", handlerResetRequestsCount);
app.post(apiPath + "/validate_chirp", handlerValidateChirp);


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});