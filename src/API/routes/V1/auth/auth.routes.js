import express from "express";
import jwt from "jsonwebtoken";
import {generateAccessToken, generateRefreshToken, verifyJoi} from "../../../../helper/helper.js"
import {
    signUp,
    login,
    getProfile,
    changeUserInfo,
    addRefreshToken, getRefreshTokenByHash, deleteRefreshToken
} from "../../../../services/auth/user.auth.services.js";
import {signUpSchema, loginSchema, changeCredentialsSchema} from "../../../../validation/auth/users.auth.js"
import {accessVerification} from "../../../middleware/authMiddleware.js";
import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";

const app = express();

const router = express.Router();



router.put('/refresh', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).send("No token provided");
        const decode = jwt.verify(token, process.env["REFRESH_TOKEN_SECRET"]);
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const storedToken = await getRefreshTokenByHash(hashedToken, decode.id);
        if (storedToken.error) return res.status(401).send("token doesnt exist");
        if (storedToken.expiresIn <= new Date()) return res.status(401).send("token expired");
        await deleteRefreshToken(hashedToken, decode.id);
        const refresh = generateRefreshToken(decode.id);
        const access = generateAccessToken(decode.id);
        res.cookie("refreshToken", refresh, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge:7 * 24 * 60 * 60 * 1000 });
        return res.status(200).json({access, refresh});
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error.message})
    }
})
router.post('/signup', async (req, res) => {
    try {
        const JoiSchema = verifyJoi(signUpSchema, req.body);
        if (JoiSchema.error) {
            return res.status(400).json({error: JoiSchema.error});
        }

        const user = await signUp(JoiSchema.value)
        if (user.error) {
            return res.status(400).json({error: user.error});
        }

        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

        await addRefreshToken(refreshToken, user.id)
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge:7 * 24 * 60 * 60 * 1000 });
        return res.status(200).json({
            value: user,
            massage: 'Sign in successfully',
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    } catch (error) {
        return res.status(400).json({error: error.massage});
    }
})

router.post('/login', async (req, res) => {
    try {
        const joiSchema = verifyJoi(loginSchema, req.body);
        if (joiSchema.error) {
            return res.status(400).json({error: joiSchema.error});
        }
        const user = await login(joiSchema.value)
        if (user.error) {
            return res.status(400).json({error: user.error});
        }

        const accessToken = generateAccessToken(user.id)
        const refreshToken = generateRefreshToken(user.id)

        await addRefreshToken(refreshToken, user.id)

        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge:7 * 24 * 60 * 60 * 1000 });
        return res.status(200).json({
            value: user,
            massage: 'Sign in successfully',
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    } catch (error) {
        return res.status(400).json({error: error.massage});
    }
})

router.put('/editinfo', accessVerification, async (req, res) => {
    try {
        const userId = req.id;
        const body = req.body;
        const joiSchema = verifyJoi(changeCredentialsSchema, req.body);
        if (joiSchema.error) {
            return res.status(400).json({error: joiSchema.error});
        }
        console.log(userId);
        const user = await getProfile(userId);
        if (user.error) return res.status(400).json({error: user.error});

        const changeUser = await changeUserInfo(userId, body.changes)
        if (changeUser.error) return res.status(400).json({error: user.error});

        return res.status(200).json({message : 'updated credentials successfully' , newInfo: changeUser });
    }
    catch (error) {
        console.error(error)
        res.status(500).json({error: error.massage});
    }
})
export default router