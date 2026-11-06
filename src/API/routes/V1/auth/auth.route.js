import express from "express";
import { signUpSchema, loginSchema, changeCredentialsSchema, verifyOtpSchema } from "../../../../validation/auth/users.auth.js"
import { accessVerification } from "../../../middleware/authMiddleware.js";
import { attachAbility, authorize } from "../../../middleware/casl.authorization.js";
import { connectRedis } from "../../../../loader/redis.loader.js";
import createError from "http-errors";
import jwt from "jsonwebtoken";
import {
    consumeRefreshToken,
    revokeAllForUser,
    revokeFamily,
    saveRefreshToken
} from "../../../../services/redis/refreshToken.service.js";
import { generateAccessToken, generateOtp, generateRefreshToken, joiValidator } from "../../../../helper/helper.js";
import { changeUserInfo, getProfile, login, sanitizeUser, signUp, markOtpVerified, unverifyUser } from "../../../../services/auth/user.auth.service.js";
import crypto from "crypto";
import { redisSaveOtp } from "../../../../services/redis/otp.service.js";
import { use } from "react";

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
    return res.status(200).json({ accessToken });
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
    res.status(200).json({ message: 'Logged out successfully' });
})
router.use(accessVerification, attachAbility)

function maskEmail(email) {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 3)}${'*'.repeat(Math.max(local.length - 3, 0))}@${domain}`;
}

router.get('/signup/reciveOtp', async (req, res) => {
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");
    const otp = generateOtp(user.email);
    await redisSaveOtp(otp, user.email, 'signup');
    await sendOtp(user.email, otp);
    const Email = user.email.split('@')

    return res.status(200).json({ message: `otp was successfully sent to your email with the address of ${maskEmail(user.email)}` })
})

router.post('/signup/verify-otp', async (req, res) => {
    const { otp } = await joiValidator(verifyOtpSchema, req.body);
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");

    await verifyOtp(otp, user.email, 'signup');
    const updated = await markOtpVerified(user.id);

    return res.status(200).json({
        message: "account verified successfully",
        value: sanitizeUser(updated),
    });
});

router.get('/credentialChange/reciveOtp', async (req, res) => {
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");
    const otp = generateOtp(user.email);
    await redisSaveOtp(otp, user.email, 'passwordChange');
    await sendOtp(user.email, otp);
    const Email = user.email.split('@')

    return res.status(200).json({ message: `otp was successfully sent to your email with the address of ${maskEmail(user.email)}` })
})

router.post('/credentialChange/verify-otp', async (req, res) => {
    const { otp } = await joiValidator(verifyOtpSchema, req.body);
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");

    await verifyOtp(otp, user.email, 'passwordChange');
    const updated = await markOtpVerified(user.id);

    return res.status(200).json({
        message: "account verified successfully",
        value: sanitizeUser(updated),
    });
});

router.put('/editinfo', authorize('update', 'User'), async (req, res) => {
    const body = await joiValidator(changeCredentialsSchema, req.body);
    const changedPassword = body.changes.password;
    const changedEmail = body.changes.email;

    if (changedPassword || changedEmail) {
        await unverifyUser(req.id);
        await revokeAllForUser(req.id);
        res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
    }

    const changed = await changeUserInfo(req.id, body.changes);

    let message = "updated credentials successfully";
    if (changedEmail) message = "email updated, please log in again and verify your new email";
    else if (changedPassword) message = "password updated, please log in again";

    return res.status(200).json({
        message,
        newInfo: sanitizeUser(changed),
    });
});
export default router