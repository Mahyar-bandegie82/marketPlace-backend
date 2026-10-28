import {
    deleteUserAddress,
    editAddress,
    readUserAddress,
    registerAddress,
    addFavourite,
    removeFavourite,
    clearFavourites,
    getFavourites,
} from "../../services/user/user.service.js";

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

export async function getFavouritesRouteHandler(req, res) {
    const favourites = await getFavourites(req.user.client.id);
    return res.status(200).json({ favourites });
}

export async function addFavouriteRouteHandler(req, res) {
    await addFavourite(req.user.client.id, req.params.productId);
    return res.status(201).json({ message: "Added to favourites" });
}

export async function removeFavouriteRouteHandler(req, res) {
    await removeFavourite(req.user.client.id, req.params.productId);
    return res.status(200).json({ message: "Removed from favourites" });
}

export async function clearFavouritesRouteHandler(req, res) {
    const removed = await clearFavourites(req.user.client.id);
    return res.status(200).json({ message: "Favourites cleared", removed });
}