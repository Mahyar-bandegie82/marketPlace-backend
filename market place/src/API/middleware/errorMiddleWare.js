// middleware/errorHandler.js
import createError from "http-errors";
import { ForbiddenError } from '@casl/ability';
// 404 for unmatched routes
export function notFound(req, res, next) {
    next(createError(404, "route not found"));
}

export function handleError(err, req, res, next) {
    let status = err.status || err.statusCode || 500;
    let message = err.message;

    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
        status = 401;
        message = "invalid or expired token";
    } else if (err.code === "P2002") {
        status = 409;
        message = "a record with this information already exists";
    } else if (err.code === "P2025") {
        status = 404;
        message = "record not found";
    } else if (err instanceof ForbiddenError) {
        status = 403;
        message = "you are not allowed to do this";
    }

    if (status >= 500) {
        console.error(err);
        message = "internal server error"; // don't leak internals
    }

    const body = {error: message};
    if (err.details) body.details = err.details; // validation errors

    return res.status(status).json(body);
}