import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {attachAbility} from "../../../middleware/casl.authorization.js"
import {authorize} from "../../../middleware/casl.authorization.js";
import {
    addInventorySchema,
    sellerSignUpSchema,
    ListingIdSchema,
    updateListingSchema,
    PromotionIdSchema,
    addListingToPromotionSchema,
    createPromotionSchema,
    promotionListingParamsSchema,
    updatePromotionDiscountSchema, 
} from "../../../../validation/seller/seller.validation.js";
import {
    addToInventory,
    deleteListing, getAllListing, getListing,
    sellerSignUp,
    updateListing,
    addListingToPromotion,
    deleteListingfromPromotion,
    deletePromotion,
    getPromotionListing,
    getPromotions,
    getSellerIdWithUserId,
    startPromotion,
    updatePromotionListing,
} from "../../../../services/seller/seller.service.js";
import createError from "http-errors";
import {joiValidator} from "../../../../helper/helper.js";

const router = express.Router();

router.use(accessVerification)
router.use(attachAbility)

router.post('/sellerSignUp',authorize('create', 'Seller'), async (req, res) => {
    if(!req.body) throw createError(405, "body is missing")
    const body = await joiValidator(sellerSignUpSchema, req.body)
    const userId = req.id
    const seller = await sellerSignUp(userId, body);
    return res.status(201).json({message : "your request was posted successfully", seller : seller});
})
router.post('/addListing',authorize('create', 'SellerInventory'), async (req, res) => {
    const body = await joiValidator(addInventorySchema, req.body)
    const sellerId = req.user.seller?.id;
    if (!sellerId) throw createError(403, "only sellers can add inventory");

    const listing = await addToInventory(sellerId, body);
    return res.status(201).json({
        value: listing,
        message: 'Product added to inventory',
    });
})
router.delete('/deleteListing/:listingId', authorize('delete', 'SellerInventory'), async (req, res) => {
    const params = await joiValidator(ListingIdSchema, req.params)
    const sellerId = req.user.seller?.id;
    if (!sellerId) throw createError(403, "only sellers can remove listings");

    const listingId = Number(params.listingId);
    if (!Number.isInteger(listingId) || listingId <= 0) {
        throw createError(400, "invalid listing id");
    }

    await deleteListing(listingId, sellerId);
    return res.status(200).json({ message: 'Listing removed' });
})
router.put('/updateListing/:listingId', authorize('update', 'SellerInventory'), async (req, res) => {
    const sellerId = req.user.seller?.id;
    if(!sellerId) throw createError(403, "only sellers can update inventory");
    const params = await joiValidator(ListingIdSchema, req.params)
    const listingId = Number(params.listingId);
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
router.get('/getSellerInventory/:listingId', authorize('read', 'SellerInventory'), async (req, res) => {
    const params = await joiValidator(ListingIdSchema, req.params)
    const sellerId = req.user.seller?.id;
    if(!sellerId) throw createError(403, "only sellers can read inventory");
    const listingId = Number(req.params.listingId);
    if (!Number.isInteger(listingId) || listingId <= 0) {
        throw createError(400, "invalid listing id");
    }
    const listing = await getListing(listingId, sellerId);
    return res.status(200).json({listing});
})


router.post('/createPromotion', authorize('create', 'Promotions'), async (req, res) => {
    const body = await joiValidator(createPromotionSchema, req.body);
    const sellerId = await getSellerIdWithUserId(req.id);
    const promotion = await startPromotion(body, sellerId);
    return res.status(201).json({message: "promotion created", promotion});
});

router.get('/getPromotions', authorize('read', 'Promotions'), async (req, res) => {
    const promotions = await getPromotions(req.id);
    return res.status(200).json({promotions});
});

router.get('/getPromotionListings/:promotionId', authorize('read', 'Promotions'), async (req, res) => {
    const {promotionId} = await joiValidator(PromotionIdSchema, req.params);
    const promotion = await getPromotionListing(req.id, promotionId);
    return res.status(200).json({promotion});
});

router.post('/addListingToPromotion', authorize('create', 'Promotions'), async (req, res) => {
    const body = await joiValidator(addListingToPromotionSchema, req.body);
    const item = await addListingToPromotion(body, req.id);
    return res.status(201).json({message: "listing added to promotion", item});
});

router.patch('/updatePromotionDiscount/:promotionId/:listingId', authorize('update', 'Promotions'), async (req, res) => {
    const params = await joiValidator(promotionListingParamsSchema, req.params);
    const {discount} = await joiValidator(updatePromotionDiscountSchema, req.body);
    const result = await updatePromotionListing(req.id, {...params, discount});
    return res.status(200).json({message: "discount updated", result});
});

router.delete('/deleteListingFromPromotion/:promotionId/:listingId', authorize('delete', 'Promotions'), async (req, res) => {
    const {promotionId, listingId} = await joiValidator(promotionListingParamsSchema, req.params);
    const result = await deleteListingfromPromotion(req.id, promotionId, listingId);
    return res.status(200).json({message: "listing removed from promotion", result});
});

router.delete('/deletePromotion/:promotionId', authorize('delete', 'Promotions'), async (req, res) => {
    const {promotionId} = await joiValidator(PromotionIdSchema, req.params);
    const result = await deletePromotion(req.id, promotionId);
    return res.status(200).json({message: "promotion deleted", result});
});
export default router;