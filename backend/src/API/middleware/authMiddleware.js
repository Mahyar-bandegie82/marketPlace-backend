import jwt from "jsonwebtoken";
import createError from "http-errors";

// Verify Bearer access token in Authorization header and attach user ID to request
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

// Verify Bearer access token if provided, allowing guest access when omitted
export function optionalAccessVerification(req, res, next) {
    if (!req.headers.authorization) {
        return next();
    }
    return accessVerification(req, res, next);
}
