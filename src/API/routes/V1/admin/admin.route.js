import express from 'express';
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {SellerParamsSchema} from "../../../../validation/admin/admin.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {
    deleteSellerRouteHandler,
    readSellerRequestRouteHandler,
    verifySellerRouteHandler
} from "../../../../controllers/admin/admin.controller.js";

const router = express.Router();
router.use(accessVerification, attachAbility)

router.get('/sellerReq', authorize('read', 'Seller'), readSellerRequestRouteHandler)
router.patch('/verifySellers/:userId', authorize('verify', 'Seller'), validateJoiSchema(SellerParamsSchema, 'params'), verifySellerRouteHandler);
router.delete('/deleteSellers/:userId', authorize('delete', 'Seller'), validateJoiSchema(SellerParamsSchema, 'params'), deleteSellerRouteHandler);

export default router;