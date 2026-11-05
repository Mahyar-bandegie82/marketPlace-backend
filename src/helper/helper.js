import bcrypt from 'bcrypt';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import createError from "http-errors";
import Joi from "joi";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export const prismaPool = new PrismaClient()

export async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

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

export function generateAccessToken(id) {
    return jwt.sign({ id: id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
}

export function generateRefreshToken(id, familyId) {
    return jwt.sign({ id, familyId }, process.env.REFRESH_TOKEN_SECRET, { algorithm: "HS256", expiresIn: '7d', jwtid: crypto.randomUUID() });
}

export function generateOtp() {
    const otp = crypto.randomInt(100000, 999999)
    return otp
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
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
}

main();