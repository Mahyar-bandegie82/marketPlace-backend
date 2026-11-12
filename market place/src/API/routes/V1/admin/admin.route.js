import express from 'express';
import { accessVerification } from "../../../middleware/authMiddleware.js";
import {
    addProductCategory,
    SellerParamsSchema,
    updateOrderStatusSchema,
    paginationQuerySchema,
    highSpenderQuerySchema,
    limitQuerySchema,
    idParamSchema,
    productIdParamSchema,
} from "../../../../validation/admin/admin.validation.js";
import { attachAbility, authorize } from "../../../middleware/casl.authorization.js";
import {
    addcategory,
    revokeSeller,
    seeSellerRequests,
    unverifySeller,
    verifySeller,
} from "../../../../services/admin/admin.service.js";
import * as adminService from "../../../../services/admin/admin.service.js";
import { joiValidator } from "../../../../helper/helper.js";

const router = express.Router();
router.use(accessVerification, attachAbility)

// ---------- seller management ----------

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
    await unverifySeller(params.userId);
    return res.status(200).json({ message: 'seller unverified successfully' });
});

// ---------- catalog ----------

router.post('/addProductCategory', authorize('manage', 'ProductCategory'), async (req, res) => {
    const body = await joiValidator(addProductCategory, req.body)
    const productCategory = await addcategory(body);
    return res.status(200).json({ message: 'ProductCategory added successfully', productCategory });
});

// ---------- admin panel ----------

router.get('/users/unverified', authorize('read', 'User'), async (req, res) => {
    const { page, limit } = await joiValidator(paginationQuerySchema, req.query);
    res.json(await adminService.getNonOtpVerifiedUsers({ page, limit }));
});

router.delete('/users/unverified/stale', authorize('delete', 'User'), async (req, res) => {
    res.json(await adminService.delete30DaysOldNonOtpVerifiedUsers());
});

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

router.get('/analytics/brands/best-selling', authorize('read', 'Product'), async (req, res) => {
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getBestSellingBrands(limit));
});

router.get('/analytics/brands/by-product-count', authorize('read', 'Product'), async (req, res) => {
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getBrandsByProductCount(limit));
});

router.patch('/orders/:id/status', authorize('update', 'Order'), async (req, res) => {
    const { id } = await joiValidator(idParamSchema, req.params);
    const { status } = await joiValidator(updateOrderStatusSchema, req.body);
    res.json(await adminService.changeOrderStatus(id, status));
});

router.get('/comments/most-liked', authorize('read', 'Comment'), async (req, res) => {
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getMostLikedComments(limit));
});

router.get('/products/:productId/comments/most-liked', authorize('read', 'Comment'), async (req, res) => {
    const { productId } = await joiValidator(productIdParamSchema, req.params);
    const { limit } = await joiValidator(limitQuerySchema, req.query);
    res.json(await adminService.getMostLikedCommentsForProduct(productId, limit));
});

export default router;