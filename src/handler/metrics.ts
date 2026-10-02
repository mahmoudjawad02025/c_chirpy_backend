import { Request, Response } from "express";
import { config } from "../config.js";
import { clearUsers } from "../db/queries/users.js";


export function handlerWriteRequestsCount(req: Request, res: Response) {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
      </body>
    </html>
  `)
}


export async function handlerResetRequestsCount(req: Request, res: Response) {
  if(config.api.platform !== 'dev')
    return res.status(403).send("Forbidden: Resetting request count is only allowed in development environment.");
  config.api.fileserverHits = 0;
  await clearUsers();
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits: ${config.api.fileserverHits}`);
}

