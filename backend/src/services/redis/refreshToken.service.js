// services/auth/refreshToken.store.js
import crypto from "crypto";
import redis from "../../loader/redis.loader.js";

const TTL = 7 * 24 * 60 * 60;   // seconds; keep equal to the JWT's 7d
const sha256 = (v) => crypto.createHash("sha256").update(v).digest("hex");

const tokenKey = (hash) => `rt:${hash}`;
const familyKey = (fid) => `rt:family:${fid}`;
const userKey = (id) => `rt:user:${id}`;

export async function saveRefreshToken(token, userId, familyId) {
    const hash = sha256(token);
    await redis
        .multi()
        .set(tokenKey(hash), JSON.stringify({ userId, familyId }), { EX: TTL })
        .set(familyKey(familyId), hash, { EX: TTL })
        .sAdd(userKey(userId), familyId)
        .expire(userKey(userId), TTL)
        .exec();
}

// single use: GETDEL reads and deletes in one atomic step
export async function consumeRefreshToken(token) {
    const raw = await redis.getDel(tokenKey(sha256(token)));
    return raw ? JSON.parse(raw) : null;
}

export async function revokeFamily(familyId) {
    const hash = await redis.getDel(familyKey(familyId));
    if (hash) await redis.del(tokenKey(hash));
}

export async function revokeAllForUser(userId) {
    const families = await redis.sMembers(userKey(userId));
    await Promise.all(families.map(revokeFamily));
    await redis.del(userKey(userId));
}