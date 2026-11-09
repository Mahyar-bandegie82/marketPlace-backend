import express from 'express';
import { accessVerification } from "../../../middleware/authMiddleware.js";
import { addProductCategory, SellerParamsSchema, updateOrderStatusSchema } from "../../../../validation/admin/admin.validation.js";
import { OrderIdSchema } from "../../../../validation/order/order.validation.js";
import { attachAbility, authorize } from "../../../middleware/casl.authorization.js";
import {
    addcategory,
    revokeSeller,
    seeSellerRequests,
    unverifySeller,
    verifySeller,
    updateorderStatus
} from "../../../../services/admin/admin.service.js";
import { joiValidator } from "../../../../helper/helper.js";

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
    return res.status(200).json({ message: 'ProductCategory added successfully ', productCategory });
});

router.patch('/updateOrderStatus/:orderId', authorize('update', 'Order'), async (req, res) => {
    const { orderId } = await joiValidator(OrderIdSchema, req.params)
    const { status } = await joiValidator(updateOrderStatusSchema, req.body)
    const order = await updateorderStatus(orderId, status)
    return res.status(200).json({ message: 'Order status updated successfully', order });
});

router.get('/users/unverified', authorize('read', 'User'), async (req, res) => {
    const { page, limit } = await joiValidator(paginationQuerySchema, req.query);
    res.json(await adminService.getNonOtpVerifiedUsers({ page, limit }));
});

router.delete('/users/unverified/stale', authorize('delete', 'User'), async (req, res) => {
    res.json(await adminService.delete30DaysOldNonOtpVerifiedUsers());
});



//admin panel routes

router.get('/clients/loyal', authorize('read', 'Client'), async (req, res) => {
    res.json(await adminService.getLoyalCustomers());
});

router.get('/clients/high-spenders', authorize('read', 'Client'), async (req, res) => {
    const { minAmount } = await joiValidator(highSpenderQuerySchema, req.query);
    res.json(await adminService.getUsersWithHighAmountSpent(minAmount));
});


router.get('/sellers/trusted', authorize('read', 'Seller'), async (req, res) => {
    res.json(await adminService.getAllTrustedSellers());
});


router.get('/analytics/brands/best-selling', async (req, res) => {
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getBestSellingBrands(limit));
});

router.get('/analytics/brands/by-product-count', async (req, res) => {
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getBrandsByProductCount(limit));
});

router.patch('/orders/:id/status', authorize('update', 'Order'), async (req, res) => {
    const { id } = await joiValidator(idParamSchema, req.params);
    const { status } = await joiValidator(orderStatusBodySchema, req.body);
    res.json(await adminService.changeOrderStatus(id, status));
});

router.get('/comments/most-liked', async (req, res) => {
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getMostLikedComments(limit));
});

router.get('/products/:productId/comments/most-liked', async (req, res) => {
    const { productId } = await joiValidator(productIdParamSchema, req.params);
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getMostLikedCommentsForProduct(productId, limit));
});

export default router;