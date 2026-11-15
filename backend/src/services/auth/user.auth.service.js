import { PrismaClient } from '@prisma/client';
import createError from "http-errors";
import crypto from "crypto";
import { comparePassword, hashPassword } from "../../helper/helper.js";
import { prismaPool } from "../../helper/helper.js";

const prisma = prismaPool;

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Remove sensitive credentials like passwords from user object before returning to client
export function sanitizeUser(user) {
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
}

// Fetch user profile by ID
export async function getProfile(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw createError(404, "user not found");
    return user;
}

// Register a new user, create client profile, and initialize an empty shopping cart
export async function signUp(json) {
    const existing = await prisma.user.findFirst({
        where: { OR: [{ phoneNumber: json.phoneNumber }, { email: json.email }] }
    });
    if (existing) throw createError(409, "user already exists");

    const hashedPassword = await hashPassword(json.password);
    return await prisma.$transaction(async tx => {
        const newUser = await tx.user.create({
            data: {
                userName: json.userName,
                password: hashedPassword,
                phoneNumber: json.phoneNumber,
                email: json.email,
            },
            include: {
                admin: { select: { id: true } },
                seller: { select: { id: true, verified: true, storeName: true } },
                client: { select: { id: true } }
            }
        });
        const client = await tx.client.create({
            data: {
                userId: newUser.id,
            }
        });
        await tx.shoppingCart.create({
            data: { clientId: client.id },
        });
        return newUser;
    });
}

// Authenticate user credentials and return user with associated roles
export async function login(json) {
    const user = await prisma.user.findUnique({
        where: { phoneNumber: json.phoneNumber },
        include: {
            admin: { select: { id: true } },
            seller: { select: { id: true, verified: true, storeName: true } },
            client: { select: { id: true } }
        }
    });

    if (!user
        || json.userName !== user.userName
        || !(await comparePassword(json.password, user.password))) {
        throw createError(401, "invalid username or password");
    }

    return user;
}

// Update user account details such as username, email, phone, or password
export async function changeUserInfo(userId, json) {
    const data = {};
    if (json.userName) data.userName = json.userName;
    if (json.phoneNumber) data.phoneNumber = json.phoneNumber;
    if (json.email) data.email = json.email;
    if (json.password) data.password = await hashPassword(json.password);

    return prisma.user.update({ where: { id: userId }, data });
}

// Mark a user account as OTP verified
export async function markOtpVerified(userId) {
    return prisma.user.update({ where: { id: userId }, data: { otpVerified: true } });
}

// Set user account verification status to false
export async function unverifyUser(userId) {
    return prisma.user.update({ where: { id: userId }, data: { otpVerified: false } });
}
