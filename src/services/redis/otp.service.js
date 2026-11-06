import { hashPassword } from "../../helper/helper.js";
import { comparePassword } from "../../helper/helper.js";
import redis from "../../loader/redis.loader.js";
import createError from "http-errors";

const TTL = 2 * 60;
const MAX_ATTEMPTS = 3;

const action = {
    signup: (email) => `otp:signup:${email}`,
    passwordChange: (email) => `otp:passwordChange:${email}`
}

export async function redisSaveOtp(otp, email, purpose) {
    if (!(purpose === "signup" || purpose === "passwordChange")) {
        throw createError(400, 'invalid database action')
    }
    const key = action[purpose](email.toLowerCase());
    const attemptsKey = `${key}:attempts`;
    const cooldownKey = `${key}:cooldown`;

    const encryptedOtp = await hashPassword(String(otp));

    const allowed = await redis.set(cooldownKey, '1', { EX: COOLDOWN, NX: true });
    if (!allowed) throw createError(429, "please wait before requesting another otp");

    await redis
        .multi()
        .set(key, encryptedOtp, { EX: TTL })
        .set(attemptsKey, 0, { EX: TTL })
        .exec();
}

export async function verifyOtp(otp, email, purpose) {
    if (!(purpose === "signup" || purpose === "passwordChange")) {
        throw createError(400, 'invalid database action')
    }
    const key = action[purpose](email.toLowerCase())
    const attemptsKey = `${key}:attempts`;

    const hash = await redis.get(key)
    if (!hash) throw createError(404, "otp was not found");

    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) await redis.expire(attemptsKey, TTL);

    if (attempts > MAX_ATTEMPTS) {
        await redis.del([key, attemptsKey])
        throw createError(429, "Too many attempts, request a new OTP");
    }

    if (!await comparePassword(String(otp), hash)) {
        throw createError(400, "otp is incorrect")
    }

    await redis.del([key, attemptsKey]);
}