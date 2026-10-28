import express from "express";
import {
    addInventoryRouteHandler,
    deleteListingRouteHandler,
    signUpForSellers
} from "../../../../controllers/seller/seller.controller.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility} from "../../../middleware/casl.authorization.js"
import {authorize} from "../../../middleware/casl.authorization.js";
import {addInventorySchema, sellerSignUpSchema, deleteListingSchema} from "../../../../validation/seller/seller.validation.js";
import {addToInventory} from "../../../../services/seller/seller.service.js";

const router = express.Router();

router.use(accessVerification)
router.use(attachAbility)

router.post('/sellerSignUp',authorize('create', 'Seller'), validateJoiSchema(sellerSignUpSchema), signUpForSellers)
router.post('/addListing',authorize('create', 'SellerInventory'), validateJoiSchema(addInventorySchema), addInventoryRouteHandler)
router.delete('/deleteListing/:id', authorize('delete', 'SellerInventory'),validateJoiSchema(deleteListingSchema, 'params'), deleteListingRouteHandler)

export default router;