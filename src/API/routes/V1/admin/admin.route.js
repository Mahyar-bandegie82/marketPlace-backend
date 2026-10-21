import express from 'express';
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {seeSellerRequests , verifySeller, revokeSeller} from "../../../../services/admin/admin.services.js";
import {SellerParamsSchema} from "../../../../validation/admin/admin.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";

const router = express.Router();
router.use(accessVerification, attachAbility)

router.get('/sellerReq', authorize('read', 'Seller'), async (req, res) => {
    const sellers = await seeSellerRequests();
    return res.status(200).json(sellers);
})

router.patch('/verifySellers/:userId', authorize('verify', 'Seller'), validateJoiSchema(SellerParamsSchema, 'params'), async (req, res) => {
    const seller = await verifySeller(req.params.userId);
    return res.status(200).json({ message: 'seller verified successfully', seller });
});

router.delete('/deleteSellers/:userId', authorize('delete', 'Seller'), validateJoiSchema(SellerParamsSchema, 'params'), async (req, res) => {
    await revokeSeller(req.params.userId);
    return res.status(200).json({ message: 'seller revoked successfully' });
});

export default router;