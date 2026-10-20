import jwt from 'jsonwebtoken';
import createError from "http-errors";
import {getProfile} from "../../services/auth/user.auth.services.js";
import {PrismaClient} from "@prisma/client";

export function accessVerification(req, res, next) {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({message: "Token not found"});
    }

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, payload) => {
            if (err) {
                const expired = err.name === 'TokenExpiredError';
                return res.status(401).json({
                    message: expired ? "Token expired" : "Token was invalid",
                });
            }
            req.id = payload.id;
            next();
        }
    );
}

export function optionalAccessVerification(req, res, next) {
    // no Authorization header at all -> guest, req.id stays undefined
    if (!req.headers.authorization) {
        return next();
    }

    // a token was sent, so it must be valid: reuse the strict check
    return accessVerification(req, res, next);
}

