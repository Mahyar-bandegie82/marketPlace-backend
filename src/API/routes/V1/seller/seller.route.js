import express from 'express';
import {validate} from "../../../../helper/helper.js";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import createError from "http-errors";
import {handleError, notFound} from "../../../middleware/errorMiddleWare.js";
import {sellerSignUpSchema} from "../../../../validation/seller/seller.validation.js";
import {sellerSignUp} from "../../../../services/seller/seller.service,js.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";


const router = express.Router();

router.use(accessVerification)
router.use(attachAbility)

router.post('/sellerSignUp',authorize('create', 'Seller'), validateJoiSchema(sellerSignUpSchema), async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const userId = req.id
    const seller = await sellerSignUp(userId, req.body);
    return res.status(201).json({message : "your request was posted successfully", seller : seller});
})

export default router;