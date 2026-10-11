import express from "express";
import jwt from "jsonwebtoken";
import {generateAccessToken, generateRefreshToken, verifyJoi} from "../../../../helper/helper.js"
import {signUp, login} from "../../../../services/auth/user.auth.services.js";
import {signUpSchema, loginSchema} from "../../../../validation/auth/users.auth.js"

const app = express();

const router = express.Router();

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

export default router