import express from "express";
import { middlewareLogResponses } from './middlewares/logging.js';
import { middlewareMetricsInc } from "./middlewares/MetricsInc.js";
import { handlerReadiness } from "./handlers/health.js";
import { handlerResetRequestsCount, handlerWriteRequestsCount } from "./handlers/metrics.js";
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json' with { type: "json" };
import { handlerCreateChirp, handlerDeleteChirp, handlerGetChirpById, handlerGetChirps } from "./handlers/chirps.js";
import { errorHandler } from "./middlewares/error.js";
import "./db/index.js";
import { config } from "./config.js";
import { handlerCreateUser, handlerUpdateUser, handlerUpgradeUserToChirpyRed } from "./handlers/users.js";
import { handlerLogin, handlerRefreshToken, handlerRevokeToken } from "./handlers/auth.js";
import path from "path";
import { apiReference } from "@scalar/express-api-reference";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - core


const apiPath = "/api";
const appPath = "/app";
const adminPath = "/admin";
const app = express();


// apiDoc - swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(middlewareLogResponses);
app.use(appPath, middlewareMetricsInc, express.static("./src/app"));
app.use(express.json()); // Built-in JSON body parsing middleware


// core
app.get(apiPath + "/healthz", handlerReadiness);
app.get(adminPath + "/metrics", handlerWriteRequestsCount);
app.post(adminPath + "/reset", handlerResetRequestsCount);
// auth
app.post(apiPath + "/login", handlerLogin);
app.post(apiPath + "/refresh", handlerRefreshToken); 
app.post(apiPath + "/revoke", handlerRevokeToken); 
// others
app.post(apiPath + "/users", handlerCreateUser);
app.put(apiPath + "/users", handlerUpdateUser);
app.post(apiPath + "/chirps", handlerCreateChirp);
app.get(apiPath + "/chirps", handlerGetChirps); 
app.get(apiPath + "/chirps/:chirpId", handlerGetChirpById); 
app.delete(apiPath + "/chirps/:chirpId", handlerDeleteChirp); 
app.post(apiPath + "/polka/webhooks", handlerUpgradeUserToChirpyRed);


// apiDoc - scalar
app.use("/reference", apiReference({ url: "/swagger.json", theme: "purple" }));
app.get("/swagger.json", (req, res) => {
  res.sendFile(path.resolve("swagger.json"));
});
   
app.use(errorHandler);


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen


app.listen(config.api.port, () => {
  console.log(`Server is running at http://localhost:${config.api.port}`);
});
