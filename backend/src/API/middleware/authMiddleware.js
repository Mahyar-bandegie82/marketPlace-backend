import jwt from "jsonwebtoken";
import createError from "http-errors";

export function accessVerification(req, res, next) {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) {
        return next(createError(401, "token not found"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) {
            const expired = err.name === "TokenExpiredError";
            return next(createError(401, expired ? "token expired" : "token was invalid"));
        }
        req.id = payload.id;
        next();
    });
}

export function optionalAccessVerification(req, res, next) {
    if (!req.headers.authorization) {
        return next();
    }
    return accessVerification(req, res, next);
}