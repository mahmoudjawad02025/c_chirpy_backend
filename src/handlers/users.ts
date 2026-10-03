import { Request, Response } from "express";
import { createUser, updateUser, upgradeUserToChirpyRed } from "../db/queries/users.js";
import { getBearerToken, hashPassword, validateJWT } from "../core/auth.js";
import { config } from "../config.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../middlewares/error.js";
 

export async function handlerCreateUser(req: Request, res: Response) {
    const parsed = req.body as { email?: unknown, password?: unknown };

    if(typeof parsed.email !== 'string' || parsed.email === undefined || parsed.password === undefined || typeof parsed.password !== 'string') 
        return res.status(400).json({ error: "Something went wrong" });
    const hashedPassword = await hashPassword(parsed.password);
    const user = await createUser({email: parsed.email, hashedPassword: hashedPassword });

    const cleanedBody = {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isChirpyRed: user.isChirpyRed
    }
    return res.status(201).json(cleanedBody);
}




export async function handlerUpdateUser(req: Request, res: Response) {
    // check params
    const parsed = req.body as { email?: unknown, password?: unknown };
    if(typeof parsed.email !== 'string' || parsed.email === undefined || parsed.password === undefined || typeof parsed.password !== 'string') 
        return res.status(400).json({ error: "Something went wrong" });

    // check token
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.jwt.secret);
    if(!userId)
        return res.status(401).json({ error: "Invalid token" });

    
    const hashedPassword = await hashPassword(parsed.password);
    const user = await updateUser({id: userId, email: parsed.email, hashedPassword: hashedPassword });

    const response = {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isChirpyRed: user.isChirpyRed,
    }
    return res.status(200).json(response);
}


export async function handlerUpgradeUserToChirpyRed(req: Request, res: Response) {

    // check apiKey
    const apiKey = getBearerToken(req);
    if(apiKey !== config.api.polkaUpgradeKey)
        throw new UnauthorizedError("Invalid API key");

    // check params
    const parsed = req.body as { event?: unknown; data?: unknown };

    if (typeof parsed.event !== "string")
    throw new BadRequestError("Invalid request body");

    if (parsed.event !== "user.upgraded") return res.sendStatus(204);

    if (typeof parsed.data !== "object" || parsed.data === null)
    throw new BadRequestError("Invalid request body");

    const data = parsed.data as { userId?: unknown };
    if (typeof data.userId !== "string")
    throw new BadRequestError("Invalid request body");

    // respond
    const respond = await upgradeUserToChirpyRed(data.userId);
    if (!respond || respond.length === 0)
    throw new NotFoundError("User not found");

    return res.sendStatus(204);
}
