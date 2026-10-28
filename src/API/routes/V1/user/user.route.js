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
    addAddressRouteHandler,
    deleteAddressRouteHandler, editAddressRouteHandler,
    readAddressRouteHandler, getFavouritesRouteHandler, addFavouriteRouteHandler, removeFavouriteRouteHandler,
    clearFavouritesRouteHandler
} from "../../../../controllers/user/user.controller.js";


const router = express.Router();
router.use(accessVerification)
router.use(attachAbility)

router.put('/addAddres', validateJoiSchema(addressVal), authorize('create', 'Client'), addAddressRouteHandler)
router.get("/readAddress", authorize('read', 'Client'), readAddressRouteHandler)
router.delete("/deleteAddress", validateJoiSchema(deleteAddressval), authorize('delete', 'Client'), deleteAddressRouteHandler)
router.put("/editAddress", validateJoiSchema(editAddressVal), authorize('update', 'Client'), editAddressRouteHandler)

router.get('/readFavoritedItems', authorize('read', 'FavouriteProducts'), getFavouritesRouteHandler);
router.post('/addFavoritedItems/:productId', authorize('create', "FavouriteProducts"), validateJoiSchema(ProductIdSchema, 'params'), addFavouriteRouteHandler)
router.delete('/deletefavoritedItem/:productId', authorize('delete', "FavouriteProducts"), validateJoiSchema(ProductIdSchema, 'params'), removeFavouriteRouteHandler)
router.delete('/clearfavoritedItems', authorize('delete', "FavouriteProducts"), clearFavouritesRouteHandler)

export default router;