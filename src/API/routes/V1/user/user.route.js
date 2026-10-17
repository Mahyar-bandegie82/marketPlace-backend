import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {validate} from "../../../../helper/helper.js";
import {addressVal} from "../../../../validation/user/user.validation.js";
import createError from "http-errors";

const router = express.Router();
router.use(accessVerification)

router.get('/readAddress', async (req, res) => {
    const body = validate(addressVal, req.body, )
    if (!body) throw createError(400, 'address validation failed');
})
export default router;