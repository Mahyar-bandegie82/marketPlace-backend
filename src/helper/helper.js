import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createError from "http-errors";
import {PrismaClient} from "@prisma/client";

export const prisma = new PrismaClient()
export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function validate(schema, body) {
    const { error, value } = schema.validate(body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        throw createError(400, errorMessage);
    }
    return value;
}

export function generateAccessToken(id) {
    return jwt.sign({id: id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2h'});
}

export function generateRefreshToken(id) {
    return jwt.sign({id: id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
}



