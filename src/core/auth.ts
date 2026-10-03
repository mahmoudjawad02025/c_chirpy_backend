import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import crypto from "crypto";
import { UnauthorizedError } from "../middlewares/error.js";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - types


type Payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - password hashing


export async function hashPassword(password: string): Promise<string>{
    return await argon2.hash(password);
}
 


export async function checkPasswordHash(password: string, hash: string): Promise<boolean>{
    return await argon2.verify(hash, password);
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - jwt / token


export function makeJWT(userID: string, expiresIn: number, secret: string): string{
    const payload: Payload = {
        iss: "chirpy",
        sub: userID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn
    }
    return jwt.sign(payload, secret);
}


export function getBearerToken(req: Request): string{

    const authHeader = req?.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or invalid Authorization header");
    }
    const token = authHeader?.split(" ")[1];
    if(!token) {
        throw new UnauthorizedError("Missing token");
    }
    return token;
}


export function validateJWT(tokenString: string, secret: string): string{
    try {
        const payload = jwt.verify(tokenString, secret) as Payload;
        return payload.sub!;
    } catch (error) {
        throw new UnauthorizedError("Invalid token");
    }
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - token generation


export function makeRefreshToken(){
    const randBytes = crypto.randomBytes(32);
    return randBytes.toString("hex");
}