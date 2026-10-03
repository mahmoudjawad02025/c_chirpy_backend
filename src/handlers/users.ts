import { Request, Response } from "express";
import { createUser } from "../db/queries/users.js";
import { hashPassword } from "../core/auth.js";
 

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
        updatedAt: user.updatedAt
    }
    return res.status(201).json(cleanedBody);
}


