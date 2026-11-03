import express from 'express';
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {addProductCategory, SellerParamsSchema, updateOrderStatusSchema} from "../../../../validation/admin/admin.validation.js";
import { OrderIdSchema} from "../../../../validation/order/order.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {
    addcategory,
    revokeSeller,
    seeSellerRequests,
    unverifySeller,
    verifySeller,
    updateorderStatus
} from "../../../../services/admin/admin.service.js";
import {joiValidator} from "../../../../helper/helper.js";

const router = express.Router();
router.use(accessVerification, attachAbility)

router.get('/sellerReq', authorize('read', 'Seller'), async (req, res) => {
    const sellers = await seeSellerRequests();
    return res.status(200).json(sellers);
})
router.patch('/verifySellers/:userId', authorize('verify', 'Seller'), async (req, res) => {
    const params = await joiValidator(SellerParamsSchema, req.params)
    const seller = await verifySeller(params.userId);
    return res.status(200).json({ message: 'seller verified successfully', seller });
});
router.delete('/deleteSellers/:userId', authorize('delete', 'Seller'), async (req, res) => {
    const params = await joiValidator(SellerParamsSchema, req.params)
    await revokeSeller(params.userId);
    return res.status(200).json({ message: 'seller deleted successfully' });
});
router.put('/unverifySeller/:userId', authorize('unverify', 'Seller'), async (req, res) => {
    const params = await joiValidator(SellerParamsSchema, req.params)
    const seller = await unverifySeller(params.userId);
    return res.status(200).json({ message: 'seller unverified successfully' });
});
router.post('/addProductCategory', authorize('manage', 'ProductCategory'), async (req, res) => {
    const body = await joiValidator(addProductCategory, req.body)
    const productCategory = await addcategory(req.body);
    return res.status(200).json({message: 'ProductCategory added successfully ', productCategory} );
});

router.patch('/updateOrderStatus/:orderId', authorize('update', 'Order'), async (req, res) => {
    const {orderId} = await joiValidator(OrderIdSchema, req.params)
    const {status} = await joiValidator(updateOrderStatusSchema, req.body)
    const order = await updateorderStatus(orderId, status)
    return res.status(200).json({ message: 'Order status updated successfully', order });
});
export default router;