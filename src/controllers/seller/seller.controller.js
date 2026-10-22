import createError from "http-errors";
import {sellerSignUp} from "../../services/seller/seller.service.js";


export async function signUpForSellers(req, res) {
    if(!req.body) throw createError(405, "body is missing")
    const userId = req.id
    const seller = await sellerSignUp(userId, req.body);
    return res.status(201).json({message : "your request was posted successfully", seller : seller});
}