import express from 'express';
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {addProductCategory, SellerParamsSchema} from "../../../../validation/admin/admin.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {
    addToProductCategoryRouteHandler,
    deleteSellerRouteHandler,
    readSellerRequestRouteHandler, unverifySellerRouteHandler,
    verifySellerRouteHandler
} from "../../../../controllers/admin/admin.controller.js";
import {addInventoryRouteHandler} from "../../../../controllers/seller/seller.controller.js";

const router = express.Router();
router.use(accessVerification, attachAbility)

router.get('/sellerReq', authorize('read', 'Seller'), readSellerRequestRouteHandler)
router.patch('/verifySellers/:userId', authorize('verify', 'Seller'), validateJoiSchema(SellerParamsSchema, 'params'), verifySellerRouteHandler);
router.delete('/deleteSellers/:userId', authorize('delete', 'Seller'), validateJoiSchema(SellerParamsSchema, 'params'), deleteSellerRouteHandler);
router.put('/unverifySeller/:userId', authorize('unverify', 'Seller'),validateJoiSchema(SellerParamsSchema, 'params'), unverifySellerRouteHandler);
router.post('/addProductCategory', authorize('manage', 'ProductCategory'), validateJoiSchema(addProductCategory), addToProductCategoryRouteHandler);

export default router;