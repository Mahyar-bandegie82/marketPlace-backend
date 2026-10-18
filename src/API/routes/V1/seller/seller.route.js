import express from 'express';
import {validate} from "../../../../helper/helper.js";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import createError from "http-errors";
import {handlleError} from "../../../middleware/errorMiddleWare.js";
import {addressVal} from "../../../../validation/user/user.validation.js";
import {sellerSignUpSchema} from "../../../../validation/seller/seller.validation.js";
import {sellerSignUp} from "../../../../services/seller/seller.service,js.js";


const router = express.Router();
router.use(handlleError)
router.use(accessVerification)

router.post('/sellerSignUp', async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const body = validate(sellerSignUpSchema, req.body);
    const userId = req.id
    const seller = await sellerSignUp(userId, body);
    return res.status(201).json({message : "your request was posted successfully", seller : seller});
})


export default router;