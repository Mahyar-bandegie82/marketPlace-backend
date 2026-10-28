import express from "express";
import {
    addInventoryRouteHandler,
    deleteListingRouteHandler, getAllListingRouteHandler, getListingRouteHandler,
    signUpForSellers, updateListingRouteHandler
} from "../../../../controllers/seller/seller.controller.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility} from "../../../middleware/casl.authorization.js"
import {authorize} from "../../../middleware/casl.authorization.js";
import {
    addInventorySchema,
    sellerSignUpSchema,
    ListingIdSchema,
    updateListingSchema
} from "../../../../validation/seller/seller.validation.js";
import {addToInventory} from "../../../../services/seller/seller.service.js";

const router = express.Router();

router.use(accessVerification)
router.use(attachAbility)

router.post('/sellerSignUp',authorize('create', 'Seller'), validateJoiSchema(sellerSignUpSchema), signUpForSellers)
router.post('/addListing',authorize('create', 'SellerInventory'), validateJoiSchema(addInventorySchema), addInventoryRouteHandler)
router.delete('/deleteListing/:listingId', authorize('delete', 'SellerInventory'),validateJoiSchema(ListingIdSchema, 'params'), deleteListingRouteHandler)
router.put('/updateListing/:listingId', authorize('update', 'SellerInventory'), validateJoiSchema(ListingIdSchema, 'params'), validateJoiSchema(updateListingSchema), updateListingRouteHandler)
router.get('/getAllSellerInventory', authorize('read', 'SellerInventory'), getAllListingRouteHandler)
router.get('/getSellerInventory/:listingId', authorize('read', 'SellerInventory'),validateJoiSchema(ListingIdSchema, 'params'), getListingRouteHandler)
export default router;