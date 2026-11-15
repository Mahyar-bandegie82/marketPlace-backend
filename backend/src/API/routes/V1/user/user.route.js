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

// Retrieve saved shipping address for the authenticated user
router.get("/readAddress", authorize('read', 'Client'), async (req, res) => {
    const address = await readUserAddress(req.id);
    return res.status(200).json({ message: "success", address });
});

// Retrieve favorited products for the authenticated client
router.get('/readFavoritedItems', authorize('read', 'FavouriteProducts'), async (req, res) => {
    const favourites = await getFavourites(req.user.client.id);
    return res.status(200).json({ favourites });
});

// Retrieve all items in the authenticated user's shopping cart
router.get('/getCartItems', authorize('manage', 'CartItem'), async (req, res) => {
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItems = await getCartItems(shoppingCartId);
    return res.status(200).json({ message: "Cart items retrieved", cartItems });
});

// Access verification middleware for mutating requests
router.use(accessVerification);
router.use(attachAbility);

// Add a product to client favorites
router.post('/addFavoritedItems/:productId', authorize('create', 'FavouriteProducts'), async (req, res) => {
    const { productId } = await joiValidator(ProductIdSchema, req.params);
    await addFavourite(req.user.client.id, productId);
    return res.status(201).json({ message: "Added to favourites" });
});

// Add an item listing to the shopping cart
router.post('/addCartItem', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await addCartItem(shoppingCartId, listingId, req.id);
    return res.status(201).json({ message: "Item added to cart", cartItem });
});

// Register a new shipping address for the user
router.put('/addAddres', authorize('create', 'Client'), async (req, res) => {
    const body = await joiValidator(addressVal, req.body);
    const address = await registerAddress(body, req.id);
    return res.status(201).json({ message: "success", address });
});

// Update an existing shipping address for the user
router.put("/editAddress", authorize('update', 'Client'), async (req, res) => {
    const body = await joiValidator(editAddressVal, req.body);
    const updatedAddress = await editAddress(body, req.id);
    return res.status(200).json({ message: "edited address successfully", updatedAddress });
});

// Increment the quantity of a cart item
router.put('/incrementCartItemquantity', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await incrementquantityToCartItem(shoppingCartId, listingId);
    return res.status(201).json({ message: "Item quantity incremented", cartItem });
});

// Decrement the quantity of a cart item
router.put('/decrementCartItemquantity', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await decrementquantityToCartItem(shoppingCartId, listingId);
    return res.status(201).json({ message: "Item quantity decremented", cartItem });
});

// Delete a shipping address from user profile
router.delete("/deleteAddress", authorize('delete', 'Client'), async (req, res) => {
    const body = await joiValidator(deleteAddressval, req.body);
    const updatedAddress = await deleteUserAddress(body, req.id);
    return res.status(200).json({ message: "deleted address", updatedAddress });
});

// Remove a product from client favorites
router.delete('/deletefavoritedItem/:productId', authorize('delete', 'FavouriteProducts'), async (req, res) => {
    const { productId } = await joiValidator(ProductIdSchema, req.params);
    await removeFavourite(req.user.client.id, productId);
    return res.status(200).json({ message: "Removed from favourites" });
});

// Clear all favorited products for the client
router.delete('/clearfavoritedItems', authorize('delete', 'FavouriteProducts'), async (req, res) => {
    const removed = await clearFavourites(req.user.client.id);
    return res.status(200).json({ message: "Favourites cleared", removed });
});

// Remove an item from the shopping cart
router.delete('/deleteCartItem', authorize('manage', 'CartItem'), async (req, res) => {
    const { listingId } = await joiValidator(CartItemSchema, req.body);
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const cartItem = await removeCartItem(shoppingCartId, listingId);
    return res.status(200).json({ message: "Item removed from cart", cartItem });
});

// Empty the shopping cart for the user
router.delete('/clearCartItems', authorize('manage', 'CartItem'), async (req, res) => {
    const shoppingCartId = await getShoppingCartIdWithUserId(req.id);
    const removed = await clearCart(shoppingCartId);
    return res.status(200).json({ message: "Cart cleared", removed });
});

export default router;
