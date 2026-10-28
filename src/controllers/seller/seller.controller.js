import createError from "http-errors";
import {sellerSignUp, addToInventory, deleteListing} from "../../services/seller/seller.service.js";


export async function signUpForSellers(req, res) {
    if(!req.body) throw createError(405, "body is missing")
    const userId = req.id
    const seller = await sellerSignUp(userId, req.body);
    return res.status(201).json({message : "your request was posted successfully", seller : seller});
}

export async function addInventoryRouteHandler(req, res) {
    const sellerId = req.user.seller?.id;
    if (!sellerId) throw createError(403, "only sellers can add inventory");

    const listing = await addToInventory(sellerId, req.body);
    return res.status(201).json({
        value: listing,
        message: 'Product added to inventory',
    });
}

export async function deleteListingRouteHandler(req, res) {
    const sellerId = req.user.seller?.id;
    if (!sellerId) throw createError(403, "only sellers can remove listings");

    const listingId = Number(req.params.id);
    if (!Number.isInteger(listingId) || listingId <= 0) {
        throw createError(400, "invalid listing id");
    }

    await deleteListing(listingId, sellerId);
    return res.status(200).json({ message: 'Listing removed' });
}