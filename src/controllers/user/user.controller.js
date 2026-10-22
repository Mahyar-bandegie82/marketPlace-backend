import {
    deleteUserAddress,
    editAddress,
    readUserAddress,
    registerAddress
} from "../../../../services/user/user.service.js";

export async function addAddressRouteHandler(req, res) {
    const userId = req.id
    const address = await registerAddress(req.body, userId)
    res.status(201).json({message:"success", address})
}

export async function readAddressRouteHandler(req, res) {
    const userId = req.id;
    const address = await readUserAddress(userId);
    res.status(200).json({message:"success", address})
}
export async function deleteAddressRouteHandler(req, res) {
    const userId = req.id;
    const updatedAddress = await deleteUserAddress(req.body, userId);
    res.status(200).json({message : "deleted address", updatedAddress})
}
export async function editAddressRouteHandler(req, res) {
    const userId = req.id;
    const updatedAddress = await editAddress(req.body, userId);
    res.status(200).json({message : "edited address successfully" , updatedAddress})
}