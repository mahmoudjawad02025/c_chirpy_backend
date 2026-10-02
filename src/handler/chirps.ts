import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../middleware/error.js";
import { createChirp, getChirpById, getChirps } from "../db/queries/chirps.js";
import { Chirp, NewChirp } from "../db/schema.js";


export async function handlerCreateChirp(req: Request, res: Response) {
    const parsed = req.body as {body?: unknown, userId?: unknown};

    if(typeof parsed.body !== 'string' || typeof parsed.userId !== 'string') 
        return res.status(400).json({ error: "Something went wrong" });

    if(parsed.body.length > 140)
        throw new BadRequestError("Chirp is too long. Max length is 140");

    const cleanedBody = parsed.body.trim().split(' ')
        .map(w => {
            const lw = w.toLowerCase();
            return lw === "kerfuffle" || lw === "sharbert" || lw === "fornax" ? "****" : w;
        }).join(' ');
    
    const chirp: NewChirp = { body: cleanedBody, userId: parsed.userId };
    const result = await createChirp(chirp);

    return res.status(201).json(result);
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