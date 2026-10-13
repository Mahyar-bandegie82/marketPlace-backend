import {PrismaClient} from '@prisma/client'
import createError from "http-errors";
import crypto from "crypto"
import {comparePassword, hashPassword} from "../../helper/helper.js";

const prisma = new PrismaClient();

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Never send password hash or refresh token hashes to the client
export function sanitizeUser(user) {
    const {password, refreshToken, ...safeUser} = user;
    return safeUser;
}

export async function getProfile(id) {
    const user = await prisma.user.findUnique({where: {id}});
    if (!user) throw createError(404, "user not found");
    return user;
}

export async function signUp(json) {
    const existing = await prisma.user.findFirst({
        where: {OR: [{phoneNumber: json.phoneNumber}, {email: json.email}]}
    });
    if (existing) throw createError(409, "user already exists");

    const hashedPassword = await hashPassword(json.password);
    return prisma.user.create({
        data: {
            userName: json.userName,
            password: hashedPassword,
            phoneNumber: json.phoneNumber,
            email: json.email,
        }
    });
}

export async function login(json) {
    const user = await prisma.user.findUnique({
        where: {phoneNumber: json.phoneNumber},
    });

    // same message for every failure so attackers can't tell which part was wrong
    if (!user
        || json.userName !== user.userName
        || !(await comparePassword(json.password, user.password))) {
        throw createError(401, "invalid username or password");
    }

    return user;
}

export async function addRefreshToken(refreshToken, id) {
    const entry = {
        refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
        expiresIn: Date.now() + REFRESH_TTL_MS,
    };
    await prisma.user.update({
        where: {id},
        data: {refreshToken: {push: entry}}
    });
}

export async function changeUserInfo(userId, json) {
    const data = {};
    if (json.userName) data.userName = json.userName;
    if (json.phoneNumber) data.phoneNumber = json.phoneNumber;
    if (json.email) data.email = json.email;
    if (json.password) data.password = await hashPassword(json.password);

    return prisma.user.update({where: {id: userId}, data});
}

export async function getRefreshTokenByHash(hash, id) {
    const user = await getProfile(id);
    const found = (user.refreshToken ?? []).find((token) => token.refreshToken === hash);
    if (!found) throw createError(401, "token doesn't exist");
    return found;
}

export async function deleteRefreshToken(hash, id) {
    const user = await getProfile(id);
    const tokens = user.refreshToken ?? [];
    const updatedTokens = tokens.filter((token) => token.refreshToken !== hash);

    if (updatedTokens.length === tokens.length) {
        throw createError(401, "token doesn't exist");
    }

    await prisma.user.update({
        where: {id},
        data: {refreshToken: updatedTokens}
    });
}