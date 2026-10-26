import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createError from "http-errors";
import {PrismaClient} from "@prisma/client";
import crypto from "crypto";

export const prismaPool = new PrismaClient()

export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function generateAccessToken(id) {
    return jwt.sign({id: id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30m'} );
}

export function generateRefreshToken(id, familyId) {
    return jwt.sign({id , familyId}, process.env.REFRESH_TOKEN_SECRET, {algorithm : "HS256", expiresIn: '7d', jwtid : crypto.randomUUID()});
}

export function generateOtp(){
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    return code;
}

