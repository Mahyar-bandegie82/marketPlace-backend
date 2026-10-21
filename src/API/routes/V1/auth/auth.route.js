import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import createError from "http-errors";
import {generateAccessToken, generateRefreshToken} from "../../../../helper/helper.js"
import {
    signUp,
    login,
    changeUserInfo,
    addRefreshToken,
    getRefreshTokenByHash,
    deleteRefreshToken,
    sanitizeUser
} from "../../../../services/auth/user.auth.services.js";
import {signUpSchema, loginSchema, changeCredentialsSchema} from "../../../../validation/auth/users.auth.js"
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";

dotenv.config();

const router = express.Router();

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

router.put('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw createError(401, "no token provided");

    // invalid/expired JWTs throw and are mapped to 401 in the error middleware
    const decoded = jwt.verify(token, process.env["REFRESH_TOKEN_SECRET"]);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const storedToken = await getRefreshTokenByHash(hashedToken, decoded.id);
    if (storedToken.expiresIn <= Date.now()) throw createError(401, "token expired");

    // rotate: remove the old token, issue and STORE a new one
    await deleteRefreshToken(hashedToken, decoded.id);
    const refreshToken = generateRefreshToken(decoded.id);
    const accessToken = generateAccessToken(decoded.id);
    await addRefreshToken(refreshToken, decoded.id);

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(200).json({accessToken});
})

router.post('/signup',validateJoiSchema(signUpSchema), async (req, res) => {
    const user = await signUp(req.body);
    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)
    await addRefreshToken(refreshToken, user.id)

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(201).json({
        value: sanitizeUser(user),
        message: 'Signed up successfully',
        accessToken,
    });
})

router.post('/login', validateJoiSchema(loginSchema), async (req, res) => {
    const user = await login(req.body);

    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken(user.id)
    await addRefreshToken(refreshToken, user.id)

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(200).json({
        value: sanitizeUser(user),
        message: 'Logged in successfully',
        accessToken,
    });
})

router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw createError(401, "no token provided");
    const decoded = jwt.verify(refreshToken, process.env["REFRESH_TOKEN_SECRET"]);
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await getRefreshTokenByHash(hashedToken, decoded.id);
    if(storedToken.expires <= Date.now()) throw createError(401, "token expired");
    await deleteRefreshToken(hashedToken, decoded.id);
    res.clearCookie('refreshToken');
    res.status(200).json({message: 'Logged out successfully'});
})
router.use(accessVerification, attachAbility)
router.put('/editinfo',authorize('update', 'User'), validateJoiSchema(changeCredentialsSchema) , async (req, res) => {
    const changed = await changeUserInfo(req.id, req.body.changes);

    return res.status(200).json({
        message: 'updated credentials successfully',
        newInfo: sanitizeUser(changed)
    });
})

export default router