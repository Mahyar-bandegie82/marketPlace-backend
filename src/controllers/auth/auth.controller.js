import createError from "http-errors";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {changeUserInfo, login, sanitizeUser, signUp} from "../../services/auth/user.auth.service.js";
import {generateAccessToken, generateRefreshToken} from "../../helper/helper.js";
import {connectRedis} from "../../loader/redis.loader.js"
import {
    consumeRefreshToken,
    revokeAllForUser,
    revokeFamily,
    saveRefreshToken
} from "../../services/redis/refreshToken.service.js";

await connectRedis()
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
};
const { maxAge, ...CLEAR_COOKIE_OPTIONS } = REFRESH_COOKIE_OPTIONS;

export async function refreshRouteHandler(req, res) {
    const token = req.cookies?.refreshToken;
    if (!token) throw createError(401, "no token provided");

    // invalid/expired JWTs throw and are mapped to 401 in the error middleware
    const decoded = jwt.verify(token, process.env["REFRESH_TOKEN_SECRET"], { algorithms: ["HS256"] });

    const storedToken = await consumeRefreshToken(token)
    if (!storedToken) {
        await revokeFamily(decoded.familyId);
        res.clearCookie("refreshToken");
        throw createError(401, "invalid or expired token");
    }
    // rotate: remove the old token, issue and STORE a new one
    const refreshToken = generateRefreshToken(decoded.id, decoded.familyId);
    const accessToken = generateAccessToken(decoded.id);
    await saveRefreshToken(refreshToken, decoded.id, decoded.familyId);

    res.cookie("refreshToken", refreshToken, CLEAR_COOKIE_OPTIONS);
    return res.status(200).json({accessToken});
}

export async function signupRouteHandler(req, res) {
    const user = await signUp(req.body);
    const familyId = crypto.randomUUID();
    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id, familyId);
    await saveRefreshToken(refreshToken, user.id, familyId)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(201).json({
        value: sanitizeUser(user),
        message: 'Signed up successfully',
        accessToken,
    });
}

export async function loginRouteHandler(req, res) {
    const user = await login(req.body);
    const familyId = crypto.randomUUID();

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id, familyId);
    await saveRefreshToken(refreshToken, user.id, familyId)
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(200).json({
        value: sanitizeUser(user),
        message: 'Logged in successfully',
        accessToken,
    });
}

export async function logoutRouteHandler(req, res) {

    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw createError(401, "no token provided");
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
    if (decoded.familyId) await revokeFamily(decoded.familyId);
    res.status(200).json({message: 'Logged out successfully'});
}

export async function editInfoRouteHandler(req, res) {
    const changed = await changeUserInfo(req.id, req.body.changes);
    const changedPassword = req.body.changes.password
    if(changedPassword) {
        await revokeAllForUser(changed.id)
        res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
    }

    return res.status(200).json({
        message: changedPassword
            ? "password updated, please log in again"
            : "updated credentials successfully",
        newInfo: sanitizeUser(changed),
    });
}