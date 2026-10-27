import createError from "http-errors";
import {sellerSignUp, addToInventory} from "../../services/seller/seller.service.js";


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