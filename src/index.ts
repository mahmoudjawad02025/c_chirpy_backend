import express from "express";
import { middlewareLogResponses } from './middleware/logging.js';
import { middlewareMetricsInc } from "./middleware/MetricsInc.js";
import { handlerReadiness } from "./handler/health.js";
import { handlerResetRequestsCount, handlerWriteRequestsCount } from "./handler/metrics.js";
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json' with { type: "json" };
import { handlerCreateChirp, handlerGetChirpById, handlerGetChirps } from "./handler/chirps.js";
import { errorHandler } from "./middleware/error.js";
import "./db/index.js";
import { config } from "./config.js";
import { handlerCreateUser } from "./handler/users.js";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - core


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
app.post(apiPath + "/users", handlerCreateUser);
app.post(apiPath + "/chirps", handlerCreateChirp);
app.get(apiPath + "/chirps", handlerGetChirps); 
app.get(apiPath + "/chirps/:chirpId", handlerGetChirpById); 


app.use(errorHandler);
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen


app.listen(config.api.port, () => {
  console.log(`Server is running at http://localhost:${config.api.port}`);
});