import bcrypt from 'bcrypt';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import createError from "http-errors";
import Joi from "joi";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export const prismaPool = new PrismaClient();

// Hash a plain text password using bcrypt
export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

// Compare a plain text password against a bcrypt hash
export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Validate request data against a Joi schema and format validation errors
export async function joiValidator(schema, body) {
    try {
        return await schema.validateAsync(body, {
            abortEarly: false,
            stripUnknown: true,
        });
    }
    catch (error) {
        if (!error.isJoi) throw error;
        const details = error.details.map((d) => ({
            field: d.path.join("."),
            message: d.message,
        }));
        throw createError(400, "validation failed", { details });
    }
}

// Generate a signed JWT access token for an authenticated user
export function generateAccessToken(id) {
    return jwt.sign({ id: id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
}

// Generate a signed JWT refresh token with user ID and token family
export function generateRefreshToken(id, familyId) {
    return jwt.sign({ id, familyId }, process.env.REFRESH_TOKEN_SECRET, { algorithm: "HS256", expiresIn: '7d', jwtid: crypto.randomUUID() });
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a 6-digit one-time password and dispatch it via email
export async function generateOtp(email) {
    const code = crypto.randomInt(100000, 999999);

    const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "mahyarband1382@gmail.com",
        subject: "pc marketplace authentication",
        html: `<p>well come to pc marketplace</p>

            <p>this is classified information dont share</p>

            <p>${code}</p>`,
    });

    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Sent:", data, "| code:", code);
    return code;
}
