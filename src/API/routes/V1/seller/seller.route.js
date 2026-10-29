import express from "express";
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
import {
    addToInventory,
    deleteListing, getAllListing, getListing,
    sellerSignUp,
    updateListing
} from "../../../../services/seller/seller.service.js";
import createError from "http-errors";

const router = express.Router();

router.use(accessVerification)
router.use(attachAbility)

router.post('/sellerSignUp',authorize('create', 'Seller'), validateJoiSchema(sellerSignUpSchema), async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const userId = req.id
    const seller = await sellerSignUp(userId, req.body);
    return res.status(201).json({message : "your request was posted successfully", seller : seller});
})
router.post('/addListing',authorize('create', 'SellerInventory'), validateJoiSchema(addInventorySchema), async (req, res) => {
    const sellerId = req.user.seller?.id;
    if (!sellerId) throw createError(403, "only sellers can add inventory");

    const listing = await addToInventory(sellerId, req.body);
    return res.status(201).json({
        value: listing,
        message: 'Product added to inventory',
    });
})
router.delete('/deleteListing/:listingId', authorize('delete', 'SellerInventory'),validateJoiSchema(ListingIdSchema, 'params'), async (req, res) => {
    const sellerId = req.user.seller?.id;
    if (!sellerId) throw createError(403, "only sellers can remove listings");

    const listingId = Number(req.params.listingId);
    if (!Number.isInteger(listingId) || listingId <= 0) {
        throw createError(400, "invalid listing id");
    }

    await deleteListing(listingId, sellerId);
    return res.status(200).json({ message: 'Listing removed' });
})
router.put('/updateListing/:listingId', authorize('update', 'SellerInventory'), validateJoiSchema(ListingIdSchema, 'params'), validateJoiSchema(updateListingSchema), async (req, res) => {
    const sellerId = req.user.seller?.id;
    if(!sellerId) throw createError(403, "only sellers can update inventory");
    const listingId = Number(req.params.listingId);
    if (!Number.isInteger(listingId) || listingId <= 0) {
        throw createError(400, "invalid listing id");
    }
    const body = req.body;
    const updatedListing = await updateListing(listingId, sellerId, body);
    res.status(200).json({message : "Updated successfully", updatedListing});
})
router.get('/getAllSellerInventory', authorize('read', 'SellerInventory'), async (req, res) => {
    const sellerId = req.user.seller?.id
    if(!sellerId) throw createError(403, "only sellers can read inventory");
    const listings = await getAllListing(sellerId);
    return res.status(200).json({listings});
})
router.get('/getSellerInventory/:listingId', authorize('read', 'SellerInventory'),validateJoiSchema(ListingIdSchema, 'params'), async (req, res) => {
    const sellerId = req.user.seller?.id;
    if(!sellerId) throw createError(403, "only sellers can read inventory");
    const listingId = Number(req.params.listingId);
    if (!Number.isInteger(listingId) || listingId <= 0) {
        throw createError(400, "invalid listing id");
    }
    const listing = await getListing(listingId, sellerId);
    return res.status(200).json({listing});
})
export default router;