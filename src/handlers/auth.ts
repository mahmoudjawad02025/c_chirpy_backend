import { Request, Response } from "express";
import { createUser, getUserByEmail } from "../db/queries/users.js";
import { checkPasswordHash, getBearerToken, hashPassword, makeJWT, makeRefreshToken } from "../core/auth.js";
import { integer } from "drizzle-orm/gel-core";
import { config } from "../config.js";
import { createRefreshToken, getRefreshToken, revokeRefreshToken } from "../db/queries/auth.js";
 

export async function handlerLogin(req: Request, res: Response) {

    // check params
    const parsed = req.body as { email?: unknown, password?: unknown };
    if(typeof parsed.email !== 'string' || typeof parsed.password !== 'string') 
        return res.status(400).json({ error: "Something went wrong" });

    // check user exists
    const reqPassword = parsed.password;
    const user = await getUserByEmail(parsed.email);
    if(!user) {
        return res.status(401).json({ error: "incorrect email or password" });
    }

    // check password
    const checkPassword = await checkPasswordHash(reqPassword, user.hashedPassword);
    if(!checkPassword) {
        return res.status(401).json({ error: "incorrect email or password" });
    }

    // token + expiresInSeconds
    let expiresInSeconds = 3600;
    const token = makeJWT(user.id, expiresInSeconds, config.jwt.secret);

    // refresh token
    const refreshToken = makeRefreshToken();
    const result = await createRefreshToken({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        userId: user.id
    });
    if(!result) {
        return res.status(500).json({ error: "Failed to create refresh token" });
    }

    // response
    const response = {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isChirpyRed: user.isChirpyRed,
        token: token,
        refreshToken: refreshToken,
    }
    return res.status(200).json(response);
}



export async function handlerRefreshToken(req: Request, res: Response) {
    
    const token = getBearerToken(req);
    const refreshToken = await getRefreshToken(token);
    if(!refreshToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }
    if(refreshToken.expiresAt < new Date()) {
        return res.status(401).json({ error: "Refresh token expired" });
    }
    if(refreshToken.revokedAt) {
        return res.status(401).json({ error: "Refresh token revoked" });
    }
    const newToken = makeJWT(refreshToken.userId, 3600, config.jwt.secret);
    return res.status(200).json({ token: newToken });
}



export async function handlerRevokeToken(req: Request, res: Response) {
    
    const token = getBearerToken(req);
    const refreshToken = await getRefreshToken(token);
    if(!refreshToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }
    if(refreshToken.expiresAt < new Date()) {
        return res.status(401).json({ error: "Refresh token expired" });
    }
    if(refreshToken.revokedAt) {
        return res.status(401).json({ error: "Refresh token revoked" });
    }
    await revokeRefreshToken(token);
    return res.sendStatus(204);
}