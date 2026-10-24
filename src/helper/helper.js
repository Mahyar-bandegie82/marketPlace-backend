import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createError from "http-errors";
import {PrismaClient} from "@prisma/client";

export const prismaPool = new PrismaClient()

export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function generateAccessToken(id) {
    return jwt.sign({id: id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30s'});
}

export function generateRefreshToken(id) {
    return jwt.sign({id: id}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1m'});
}



