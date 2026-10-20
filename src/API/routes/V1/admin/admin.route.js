import express from 'express';
import {validate} from "../../../../helper/helper.js";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import createError from "http-errors";
import {handlleError} from "../../../middleware/errorMiddleWare.js";
import {seeSellerRequests , verifySeller, revokeSeller} from "../../../../services/admin/admin.services.js";
import {SellerParamsSchema} from "../../../../validation/admin/admin.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";

const router = express.Router();
router.use(accessVerification, attachAbility)

router.get('/sellerReq', authorize('read', 'Seller'), async (req, res) => {
    const sellers = await seeSellerRequests();
    return res.status(200).json(sellers);
})

router.patch('/verifySellers/:userId', async (req, res) => {
    const { userId } = validate(SellerParamsSchema, req.params);
    const seller = await verifySeller(userId);
    return res.status(200).json({ message: 'seller verified successfully', seller });
});

router.delete('/deleteSellers/:userId', async (req, res) => {
    const { userId } = validate(SellerParamsSchema, req.params);
    await revokeSeller(userId);
    return res.status(200).json({ message: 'seller revoked successfully' });
});
export default router;