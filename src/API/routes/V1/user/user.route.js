import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {
    addressVal,
    deleteAddressval,
    editAddressVal,
    ProductIdSchema
} from "../../../../validation/user/user.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {joiValidator} from "../../../../helper/helper.js";
import {
    addFavourite, clearFavourites,
    deleteUserAddress,
    editAddress,
    getFavourites,
    readUserAddress,
    registerAddress,
    removeFavourite
} from "../../../../services/user/user.service.js";

const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

router.put('/addAddres', authorize('create', 'Client'), async (req, res) => {
    const body = await joiValidator(addressVal, req.body)
    const address = await registerAddress(body, req.id)
    return res.status(201).json({message: "success", address})
})

router.get("/readAddress", authorize('read', 'Client'), async (req, res) => {
    const address = await readUserAddress(req.id);
    return res.status(200).json({message: "success", address})
})

router.delete("/deleteAddress", authorize('delete', 'Client'), async (req, res) => {
    const body = await joiValidator(deleteAddressval, req.body)
    const updatedAddress = await deleteUserAddress(body, req.id);
    return res.status(200).json({message: "deleted address", updatedAddress})
})

router.put("/editAddress", authorize('update', 'Client'), async (req, res) => {
    const body = await joiValidator(editAddressVal, req.body)
    const updatedAddress = await editAddress(body, req.id);
    return res.status(200).json({message: "edited address successfully", updatedAddress})
})

router.get('/readFavoritedItems', authorize('read', 'FavouriteProducts'), async (req, res) => {
    const favourites = await getFavourites(req.user.client.id);
    return res.status(200).json({favourites});
});

router.post('/addFavoritedItems/:productId', authorize('create', 'FavouriteProducts'), async (req, res) => {
    const {productId} = await joiValidator(ProductIdSchema, req.params)
    await addFavourite(req.user.client.id, productId);
    return res.status(201).json({message: "Added to favourites"});
})

router.delete('/deletefavoritedItem/:productId', authorize('delete', 'FavouriteProducts'), async (req, res) => {
    const {productId} = await joiValidator(ProductIdSchema, req.params)
    await removeFavourite(req.user.client.id, productId);
    return res.status(200).json({message: "Removed from favourites"});
})

router.delete('/clearfavoritedItems', authorize('delete', 'FavouriteProducts'), async (req, res) => {
    const removed = await clearFavourites(req.user.client.id);
    return res.status(200).json({message: "Favourites cleared", removed});
})

export default router;