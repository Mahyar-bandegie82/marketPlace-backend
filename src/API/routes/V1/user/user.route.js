import express from "express";
import {accessVerification} from "../../../middleware/authMiddleware.js";
import {
    addressVal,
    deleteAddressval,
    editAddressVal,
    ProductIdSchema
} from "../../../../validation/user/user.validation.js";
import {attachAbility, authorize} from "../../../middleware/casl.authorization.js";
import {validateJoiSchema} from "../../../middleware/joiValidationMiddleware.js";
import {
    addFavourite, clearFavourites,
    deleteUserAddress,
    editAddress,
    getFavourites,
    readUserAddress, removeFavourite
} from "../../../../services/user/user.service.js";


const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

router.put('/addAddres', validateJoiSchema(addressVal), authorize('create', 'Client'), async (req, res) => {
    const userId = req.id
    const address = await registerAddress(req.body, userId)
    res.status(201).json({message:"success", address})
})

router.get("/readAddress", authorize('read', 'Client'), async (req, res) => {
    const userId = req.id;
    const address = await readUserAddress(userId);
    res.status(200).json({message:"success", address})
})

router.delete("/deleteAddress", validateJoiSchema(deleteAddressval), authorize('delete', 'Client'), async (req, res) => {
    const userId = req.id;
    const updatedAddress = await deleteUserAddress(req.body, userId);
    res.status(200).json({message : "deleted address", updatedAddress})
})

router.put("/editAddress", validateJoiSchema(editAddressVal), authorize('update', 'Client'), async (req, res) => {
    const userId = req.id;
    const updatedAddress = await editAddress(req.body, userId);
    res.status(200).json({message : "edited address successfully" , updatedAddress})
})

router.get('/readFavoritedItems', authorize('read', 'FavouriteProducts'), async (req, res) => {
    const favourites = await getFavourites(req.user.client.id);
    return res.status(200).json({ favourites });
});

router.post('/addFavoritedItems/:productId', authorize('create', "FavouriteProducts"), validateJoiSchema(ProductIdSchema, 'params'), async (req, res) => {
    await addFavourite(req.user.client.id, req.params.productId);
    return res.status(201).json({ message: "Added to favourites" });
})

router.delete('/deletefavoritedItem/:productId', authorize('delete', "FavouriteProducts"), validateJoiSchema(ProductIdSchema, 'params'), async (req, res) => {
    await removeFavourite(req.user.client.id, req.params.productId);
    return res.status(200).json({ message: "Removed from favourites" });
})

router.delete('/clearfavoritedItems', authorize('delete', "FavouriteProducts"), async (req, res) => {
    const removed = await clearFavourites(req.user.client.id);
    return res.status(200).json({ message: "Favourites cleared", removed });
})

export default router;