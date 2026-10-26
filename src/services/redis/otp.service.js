import redis from "../../loader/redis.loader.js"
import {hashPassword} from "../../helper/helper.js";
import {comparePassword} from "../../helper/helper.js";
const TTL = 5 * 60;

const emailKey = (email) => `email:${email}`;

export async function storeOtp(otp, userEmail) {
    const hashedOtp = await hashPassword(otp)
    await redis.set(emailKey(userEmail), hashedOtp, { EX: TTL })
}

export async function deleteOtp(email) {
    await redis.del(emailKey(email))
}

export async function getOtp(email) {
    return await redis.get(emailKey(email));
}