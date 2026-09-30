import { Request, Response, NextFunction } from "express";


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - custom error classes 


export class BadRequestError extends Error {}
export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}
export class NotFoundError extends Error {}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - error handler middleware


export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if(err instanceof BadRequestError) {
        return res.status(400).json({ error: err.message });
    }
    if(err instanceof UnauthorizedError) {
        return res.status(401).json({ error: err.message });
    }
    if(err instanceof ForbiddenError) {
        return res.status(403).json({ error: err.message });
    }
    if(err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
    }
    console.log(err);
    res.status(500).json({ error: "Internal Server Errors" });
}

