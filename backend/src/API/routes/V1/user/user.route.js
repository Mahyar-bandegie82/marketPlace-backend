import express from "express";
import { accessVerification, optionalAccessVerification } from "../../../middleware/authMiddleware.js";
import {
    addressVal,
    deleteAddressval,
    editAddressVal,
    ProductIdSchema,
    CartItemSchema,
} from "../../../../validation/user/user.validation.js";
import { attachAbility, authorize } from "../../../middleware/casl.authorization.js";
import { joiValidator } from "../../../../helper/helper.js";
import {
    addCartItem,
    addFavourite,
    clearFavourites,
    deleteUserAddress,
    editAddress,
    getCartItems,
    getFavourites,
    readUserAddress,
    registerAddress,
    removeFavourite,
    removeCartItem,
    incrementquantityToCartItem,
    decrementquantityToCartItem,
    clearCart,
    getShoppingCartIdWithUserId
} from "../../../../services/user/user.service.js";

const router = express.Router();

router.use(optionalAccessVerification, attachAbility);

// ==========================================
// GET Routes (Before Access Middleware)
// ==========================================

router.get("/readAddress", authorize('read', 'Client'), async (req, res) => {
    const address = await readUserAddress(req.id);
    return res.status(200).json({ message: "success", address });
});

router.get('/readFavoritedItems', authorize('read', 'FavouriteProducts'), async (req, res) => {
    const favourites = await getFavourites(req.user.client.id);
    return res.status(200).json({ favourites });
});

router.get('/getCartItems', authorize('manage', 'CartItem'), async (req, res) => {
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItems = await getCartItems(shoppingCartId);
    return res.status(200).json({ message: "Cart items retrieved", cartItems });
});

// ==========================================
// Access Middleware (Requires Access Token)
// ==========================================
router.use(accessVerification);
router.use(attachAbility);

// ==========================================
// POST Routes
// ==========================================

router.post('/addFavoritedItems/:productId', authorize('create', 'FavouriteProducts'), async (req, res) => {
    const { productId } = await joiValidator(ProductIdSchema, req.params);
    await addFavourite(req.user.client.id, productId);
    return res.status(201).json({ message: "Added to favourites" });
});

router.post('/addCartItem', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await addCartItem(shoppingCartId, listingId, req.id);
    return res.status(201).json({ message: "Item added to cart", cartItem });
});

// ==========================================
// PUT Routes
// ==========================================

router.put('/addAddres', authorize('create', 'Client'), async (req, res) => {
    const body = await joiValidator(addressVal, req.body);
    const address = await registerAddress(body, req.id);
    return res.status(201).json({ message: "success", address });
});

router.put("/editAddress", authorize('update', 'Client'), async (req, res) => {
    const body = await joiValidator(editAddressVal, req.body);
    const updatedAddress = await editAddress(body, req.id);
    return res.status(200).json({ message: "edited address successfully", updatedAddress });
});

router.put('/incrementCartItemquantity', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await incrementquantityToCartItem(shoppingCartId, listingId);
    return res.status(201).json({ message: "Item quantity incremented", cartItem });
});

router.put('/decrementCartItemquantity', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await decrementquantityToCartItem(shoppingCartId, listingId);
    return res.status(201).json({ message: "Item quantity decremented", cartItem });
});

// ==========================================
// DELETE Routes
// ==========================================

router.delete("/deleteAddress", authorize('delete', 'Client'), async (req, res) => {
    const body = await joiValidator(deleteAddressval, req.body);
    const updatedAddress = await deleteUserAddress(body, req.id);
    return res.status(200).json({ message: "deleted address", updatedAddress });
});

router.delete('/deletefavoritedItem/:productId', authorize('delete', 'FavouriteProducts'), async (req, res) => {
    const { productId } = await joiValidator(ProductIdSchema, req.params);
    await removeFavourite(req.user.client.id, productId);
    return res.status(200).json({ message: "Removed from favourites" });
});

router.delete('/clearfavoritedItems', authorize('delete', 'FavouriteProducts'), async (req, res) => {
    const removed = await clearFavourites(req.user.client.id);
    return res.status(200).json({ message: "Favourites cleared", removed });
});

router.delete('/deleteCartItem', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await removeCartItem(shoppingCartId, listingId);
    return res.status(200).json({ message: "Item removed from cart", cartItem });
});

router.delete('/clearCartItems', authorize('manage', 'CartItem'), async (req, res) => {
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const removed = await clearCart(shoppingCartId);
    return res.status(200).json({ message: "Cart cleared", removed });
});

export default router;
