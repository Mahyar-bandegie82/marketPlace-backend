import {
    seeSellerRequests,
    verifySeller,
    revokeSeller,
    unverifySeller,
    addcategory
} from "../../services/admin/admin.service.js";

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
    return res.status(200).json({ message: 'seller deleted successfully' });
}

export async function unverifySellerRouteHandler(req, res){
    const seller = await unverifySeller(req.params.userId);
    return res.status(200).json({ message: 'seller unverified successfully' });
}

export async function addToProductCategoryRouteHandler(req, res){
    const productCategory = await addcategory(req.body);
    return res.status(200).json({message: 'ProductCategory added successfully ', productCategory} );
}