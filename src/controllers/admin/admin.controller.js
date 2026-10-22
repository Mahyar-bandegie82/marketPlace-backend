import express from 'express';
import {seeSellerRequests , verifySeller, revokeSeller} from "../../../../services/admin/admin.service.js";

export async function readSellerRequestRouteHandler(req, res){
    const sellers = await seeSellerRequests();
    return res.status(200).json(sellers);
}

export async function verifySellerRouteHandler(req, res){
    const seller = await verifySeller(req.params.userId);
    return res.status(200).json({ message: 'seller verified successfully', seller });
}

export async function deleteSellerRouteHandler(req, res){
    await revokeSeller(req.params.userId);
    return res.status(200).json({ message: 'seller revoked successfully' });
}