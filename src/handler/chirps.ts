import { Request, Response } from "express";


export function handlerValidateChirp(req: Request, res: Response) {
    type ResponseData = {error: string} | {cleanedBody: string};

    const parsed = req.body as {body?: unknown};

    if(typeof parsed.body !== 'string') 
        return res.status(400).json({ error: "Something went wrong" } as ResponseData);

    if(parsed.body.length > 140)
        return res.status(400).json({ error: "Chirp is too long" } as ResponseData);

    const cleanedBody = parsed.body.trim().split(' ')
        .map(w => {
            const lw = w.toLowerCase();
            return lw === "kerfuffle" || lw === "sharbert" || lw === "fornax" ? "****" : w;
        }).join(' ');

    return res.status(200).json({ cleanedBody: cleanedBody } as ResponseData);
}