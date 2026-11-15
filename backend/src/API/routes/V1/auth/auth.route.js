import express from "express";
import { signUpSchema, loginSchema, changeCredentialsSchema, verifyOtpSchema } from "../../../../validation/auth/users.auth.js";
import { accessVerification, optionalAccessVerification } from "../../../middleware/authMiddleware.js";
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
import { generateAccessToken, generateOtp, generateRefreshToken, joiValidator, prismaPool } from "../../../../helper/helper.js";
import { changeUserInfo, getProfile, login, sanitizeUser, signUp, markOtpVerified, unverifyUser } from "../../../../services/auth/user.auth.service.js";
import crypto from "crypto";
import { redisSaveOtp, verifyOtp } from "../../../../services/redis/otp.service.js";

await connectRedis();
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
};
const { maxAge, ...CLEAR_COOKIE_OPTIONS } = REFRESH_COOKIE_OPTIONS;

const router = express.Router();

router.use(optionalAccessVerification, attachAbility);

// Mask the local portion of an email address for privacy
function maskEmail(email) {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 3)}${'*'.repeat(Math.max(local.length - 3, 0))}@${domain}`;
}

// Fetch current authenticated user profile
router.get('/me', async (req, res) => {
    if (!req.id) throw createError(401, "token not found");
    const user = await prismaPool.user.findUnique({
        where: { id: req.id },
        select: {
            id: true,
            userName: true,
            phoneNumber: true,
            email: true,
            otpVerified: true,
            dateCreated: true,
            admin: { select: { id: true } },
            client: { select: { id: true } },
            seller: { select: { id: true, verified: true, trusted: true, storeName: true } },
        }
    });
    if (!user) throw createError(404, "user not found");
    return res.status(200).json({ user });
});

// Generate and send an OTP code for signup email verification
router.get('/signup/reciveOtp', async (req, res) => {
    if (!req.id) throw createError(401, "token not found");
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");
    const otp = await generateOtp(user.email);
    await redisSaveOtp(otp, user.email, 'signup');
    // await sendOtp(user.email, otp);

    return res.status(200).json({ message: `otp was successfully sent to your email with the address of ${maskEmail(user.email)}` });
});

// Generate and send an OTP code for credential change verification
router.get('/credentialChange/reciveOtp', async (req, res) => {
    if (!req.id) throw createError(401, "token not found");
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");
    const otp = await generateOtp(user.email);
    await redisSaveOtp(otp, user.email, 'passwordChange');
    // await sendOtp(user.email, otp);

    return res.status(200).json({ message: `otp was successfully sent to your email with the address of ${maskEmail(user.email)}` });
});

// Register a new user account, issue authentication tokens, and set refresh cookie
router.post('/signup', async (req, res) => {
    const body = await joiValidator(signUpSchema, req.body);
    const user = await signUp(body);

    return res.status(201).json({
        value: sanitizeUser(user),
        message: 'Signed up successfully',
    });
});

// Authenticate user credentials, issue authentication tokens, and set refresh cookie
router.post('/login', async (req, res) => {
    const body = await joiValidator(loginSchema, req.body);
    const user = await login(body);
    const familyId = crypto.randomUUID();

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, familyId);
    await saveRefreshToken(refreshToken, user.id, familyId);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(200).json({
        value: sanitizeUser(user),
        message: 'Logged in successfully',
        accessToken,
    });
});

// Revoke user refresh token family and clear authentication cookie
router.post('/logout', async (req, res) => {
    res.clearCookie('refreshToken', CLEAR_COOKIE_OPTIONS);
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw createError(401, "no token provided");
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, { algorithms: ["HS256"] });
    if (decoded.familyId) await revokeFamily(decoded.familyId);
    res.status(200).json({ message: 'Logged out successfully' });
});

// Rotate refresh token and issue a new access token
router.put('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw createError(401, "no token provided");

    const decoded = jwt.verify(token, process.env["REFRESH_TOKEN_SECRET"], { algorithms: ["HS256"] });

    const storedToken = await consumeRefreshToken(token);
    if (!storedToken) {
        await revokeFamily(decoded.familyId);
        res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
        throw createError(401, "invalid or expired token");
    }

    const refreshToken = generateRefreshToken(decoded.id, decoded.familyId);
    const accessToken = generateAccessToken(decoded.id);
    await saveRefreshToken(refreshToken, decoded.id, decoded.familyId);

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(200).json({ accessToken });
});

// Access verification middleware for protected routes
router.use(accessVerification, attachAbility);

// Verify OTP code submitted for signup verification
router.post('/signup/verify-otp', async (req, res) => {
    const { otp } = await joiValidator(verifyOtpSchema, req.body);
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");

    await verifyOtp(otp, user.email, 'signup');
    const updated = await markOtpVerified(user.id);

    const familyId = crypto.randomUUID();
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, familyId);
    await saveRefreshToken(refreshToken, user.id, familyId);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
        message: "account verified successfully",
        accessToken,
        value: sanitizeUser(updated),
    });
});

// Verify OTP code submitted for credential change
router.post('/credentialChange/verify-otp', async (req, res) => {
    const { otp } = await joiValidator(verifyOtpSchema, req.body);
    const user = await getProfile(req.id);
    if (user.otpVerified) throw createError(409, "account already verified");

    await verifyOtp(otp, user.email, 'passwordChange');
    const updated = await markOtpVerified(user.id);

    const familyId = crypto.randomUUID();
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id, familyId);
    await saveRefreshToken(refreshToken, user.id, familyId);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
        message: "account verified successfully",
        accessToken,
        value: sanitizeUser(updated),
    });
});

// Update user credentials such as email or password and revoke active sessions if needed
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

export default router;
