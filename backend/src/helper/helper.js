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
                    !v.includes("localhost") &&
                    (k.includes("DATABASE_URL") || k.includes("POSTGRES") || k.endsWith("_URL"))
            )
            .map(([, v]) => v),
    ].filter((v) => typeof v === "string" && v.trim() && !v.includes("localhost"));

    const chosen =
        candidates[0] ||
        "postgresql://neondb_owner:npg_RTVW2o4hNbDk@ep-damp-silence-bb7ycyr4.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require";

    return chosen.replace(/([?&])channel_binding=require(&?)/, (_, p1, p2) =>
        p2 ? p1 : ""
    );
}

process.env.DATABASE_URL = resolveDatabaseUrl();
process.env.ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET ||
    "a4b7dbc77c22b00feff65ec932633fb6f6773414294c4e4175e9d0e3222ab579f0e7e17afb79c4f594b50a6f9d2e4d95f58426d7d6803e774e34a63aaac80ffa";
process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET ||
    "bb8a9485d1faa464ae4ef71dfc39813dcbb4ecb0a9b1a77f71ae4bb28e42e989bb0f7730c93da9387d7e0b97a56e77b240e7d5beaa55d0c664a2ba51972d343f";
process.env.GMAIL_USER = process.env.GMAIL_USER || "mahyartheswe1382@gmail.com";
process.env.MARKETPLACE_OTP_CODE = process.env.MARKETPLACE_OTP_CODE || "bloxwikjzjsaabtv";

export const prismaPool = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

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