import "dotenv/config";

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import createError from "http-errors";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import nodemailer from "nodemailer";

function resolveDatabaseUrl() {
    const candidates = [
        process.env.DATABASE_URL_UNPOOLED,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.DATABASE_URL,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
        ...Object.entries(process.env)
            .filter(
                ([k, v]) =>
                    typeof v === "string" &&
                    (v.startsWith("postgresql://") || v.startsWith("postgres://")) &&
                    (k.includes("DATABASE_URL") || k.includes("POSTGRES") || k.endsWith("_URL"))
            )
            .map(([, v]) => v),
    ].filter((v) => typeof v === "string" && v.trim());

    const cloudCandidate = candidates.find((v) => !v.includes("localhost") && !v.includes("127.0.0.1"));
    const chosen = cloudCandidate || candidates[0];

    if (!chosen) return undefined;

    return chosen.replace(/([?&])channel_binding=require(&?)/, (_, p1, p2) =>
        p2 ? p1 : ""
    );
}

const resolvedDbUrl = resolveDatabaseUrl();
if (resolvedDbUrl) {
    process.env.DATABASE_URL = resolvedDbUrl;
}

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



// Generate a 6-digit one-time password and dispatch it via email
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.MARKETPLACE_OTP_CODE,
    },
});

export async function generateOtp(email) {
    const code = crypto.randomInt(100000, 1000000);
    console.log("sending OTP to:", email);

    try {
        const info = await transporter.sendMail({
            from: `"PC Marketplace" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "PC Marketplace verification code",
            text: `Your PC Marketplace verification code is ${code}. It expires in 2 minutes.`,
            html: `
                <p>Welcome to PC Marketplace!</p>
                <p>Your verification code is:</p>
                <h2>${code}</h2>
                <p>It expires in 2 minutes. Do not share this code with anyone.</p>`,
        });
        console.log("accepted:", info.accepted, "rejected:", info.rejected, "response:", info.response);
    } catch (err) {
        console.error("Email error:", err);
        throw new Error("Failed to send verification email");
    }

    return code;
}