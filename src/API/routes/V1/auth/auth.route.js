import express from "express";
import {signUpSchema, loginSchema, changeCredentialsSchema} from "../../../../validation/auth/users.auth.js"
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {connectRedis} from "../../../../loader/redis.loader.js";
import createError from "http-errors";
import jwt from "jsonwebtoken";
import {
    consumeRefreshToken,
    revokeAllForUser,
    revokeFamily,
    saveRefreshToken
} from "../../../../services/redis/refreshToken.service.js";
import {generateAccessToken, generateRefreshToken, joiValidator} from "../../../../helper/helper.js";
import {changeUserInfo, login, sanitizeUser, signUp} from "../../../../services/auth/user.auth.service.js";
import crypto from "crypto";

await connectRedis();
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
};
const { maxAge, ...CLEAR_COOKIE_OPTIONS } = REFRESH_COOKIE_OPTIONS;

const router = express.Router();

router.put('/refresh', async (req, res) => {
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
})
router.post('/signup', async (req, res) => {
    const body = await joiValidator(signUpSchema, req.body);
    const user = await signUp(body);
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
})
router.post('/login', async (req, res) => {
    const body = await joiValidator(loginSchema, req.body)
    const user = await login(body);
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
})
router.post('/logout', async (req, res) => {
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw createError(401, "no token provided");
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
    if (decoded.familyId) await revokeFamily(decoded.familyId);
    res.status(200).json({message: 'Logged out successfully'});
})
router.use(accessVerification, attachAbility)
router.put('/editinfo',authorize('update', 'User'), async (req, res) => {
    const body = await joiValidator(changeCredentialsSchema, req.body);
    const changed = await changeUserInfo(req.id, body.changes);
    const changedPassword = body.changes.password
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
})

export default router