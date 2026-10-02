import { Request, Response } from "express";
import { BadRequestError } from "../middleware/error.js";
import { User } from "../db/schema.js";
import { createUser } from "../db/queries/users.js";


export async function handlerCreateUser(req: Request, res: Response) {
    type ResponseData = User | {error: string};
    const parsed = req.body as { email?: unknown };

    if(typeof parsed.email !== 'string' || parsed.email === undefined) 
        return res.status(400).json({ error: "Something went wrong" } as ResponseData);
    const user = await createUser({email: parsed.email});

    const cleanedBody = {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }
    return res.status(201).json(cleanedBody as ResponseData);
}