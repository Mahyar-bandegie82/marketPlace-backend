import express from 'express';
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {addProductCategory, SellerParamsSchema} from "../../../../validation/admin/admin.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {
    addcategory,
    revokeSeller,
    seeSellerRequests,
    unverifySeller
} from "../../../../services/admin/admin.service.js";

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
    return res.status(200).json({ message: 'seller deleted successfully' });
});
router.put('/unverifySeller/:userId', authorize('unverify', 'Seller'),validateJoiSchema(SellerParamsSchema, 'params'), async (req, res) => {
    const seller = await unverifySeller(req.params.userId);
    return res.status(200).json({ message: 'seller unverified successfully' });
});
router.post('/addProductCategory', authorize('manage', 'ProductCategory'), validateJoiSchema(addProductCategory), async (req, res) => {
    const productCategory = await addcategory(req.body);
    return res.status(200).json({message: 'ProductCategory added successfully ', productCategory} );
});

export default router;