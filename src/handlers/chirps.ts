import { Request, Response } from "express";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../middlewares/error.js";
import { createChirp, deleteChirp, getChirpById, getChirps } from "../db/queries/chirps.js";
import { Chirp, NewChirp } from "../db/schema.js";
import { getBearerToken, validateJWT } from "../core/auth.js";
import { config } from "../config.js";


export async function handlerCreateChirp(req: Request, res: Response) {

    // check params
    const parsed = req.body as {body?: unknown};
    if(typeof parsed.body !== 'string') 
        return res.status(400).json({ error: "Something went wrong" });

    // check token
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.jwt.secret);
    if(!userId)
        return res.status(401).json({ error: "Invalid token" });

    // check body length
    if(parsed.body.length > 140)
        throw new BadRequestError("Chirp is too long. Max length is 140");

    // check body for banned words
    const cleanedBody = parsed.body.trim().split(' ')
        .map(w => {
            const lw = w.toLowerCase();
            return lw === "kerfuffle" || lw === "sharbert" || lw === "fornax" ? "****" : w;
        }).join(' ');
    
    // response
    const chirp: NewChirp = { body: cleanedBody, userId: userId };
    const response = await createChirp(chirp);
    return res.status(201).json(response);
}


export async function handlerGetChirps(req: Request, res: Response) {
    const result = await getChirps();

    return res.status(200).json(result);
}


export async function handlerGetChirpById(req: Request, res: Response) {
    const chirpId = req.params.chirpId as string;
    const result = await getChirpById(chirpId);
    if(!result) 
        throw new NotFoundError(`Chirp with id ${chirpId} not found`);

    return res.status(200).json(result);
}



export async function handlerDeleteChirp(req: Request, res: Response) {

    // check token
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.jwt.secret);
    if(!userId)
        throw new UnauthorizedError("Invalid token");

    // check user ownership of chirp
    const chirp = await getChirpById(req.params.chirpId as string);
    if(!chirp)
        throw new NotFoundError(`Chirp with id ${req.params.chirpId} not found`);
    if(chirp.userId !== userId)
        throw new ForbiddenError("You can only delete your own chirps");

    // response
    await deleteChirp(req.params.chirpId as string);
    return res.sendStatus(204);
}