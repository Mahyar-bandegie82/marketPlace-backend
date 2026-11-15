import createError from "http-errors";
import { prismaPool } from "../../helper/helper.js";

const prisma = prismaPool;

// Append a new shipping address and postal code to the client profile
export async function registerAddress(address, userId) {
    const client = await prisma.client.findUnique({ where: { userId } });
    if (!client) throw createError(404, "client profile not found");
    const clientAddresesArray = [...client.Addresses];
    const clientPostalCodeArray = [...client.postalCode];
    if (client.Addresses.length >= 3 || clientPostalCodeArray.length >= 3) throw createError(409, "maximum address per user is 3");
    const does_exist = clientAddresesArray.find(clientaddress => clientaddress === address.addressLine);
    if (does_exist) throw createError(403, "address already exists");
    const postalCode_does_exist = clientPostalCodeArray.find(postalCode => postalCode === address.postalCode);
    if (postalCode_does_exist) throw createError(403, "postal code already exists");

    return await prisma.client.update({
        where: { userId },
        data: {
            Addresses: { push: address.addressLine },
            postalCode: { push: address.postalCode },
        },
    });
}

// export async function readUserAddress(userId) {
//     const user = await prisma.client.findUnique({
//         where : {userId : userId},
//     })
//     if (!user) throw createError(404, "user not found");
//     const output = []
//     const addressArray = [...user.Addresses]
//     const postalCodeArray = [...user.postalCode]
//     addressArray.forEach((address) => {
//         output.push({address: address})
//     })
//     let i = 0;
//     postalCodeArray.forEach((postalCode) => {
//         output[i].postalCode = postalCode;
//         i++;
//     })
//     return output
// }

// Retrieve formatted address and postal code pairs for a user
export async function readUserAddress(userId) {
    const client = await prisma.client.findUnique({
        where: { userId },
        select: { Addresses: true, postalCode: true },
    });
    if (!client) throw createError(404, "client profile not found");

    return client.Addresses.map((address, i) => ({
        address,
        postalCode: client.postalCode[i],
    }));
}

// Remove a specific address and postal code from the user profile
export async function deleteUserAddress(addressBody, userId) {
    const client = await prisma.client.findUnique({
        where: { userId },
        select: { Addresses: true, postalCode: true },
    });
    if (!client) throw createError(404, "client profile not found");
    const allAddress = client.Addresses.map((address, i) => ({
        address,
        postalCode: client.postalCode[i],
    }));
    const existingAddress = allAddress.find(address => address.address === addressBody.addressLine || address.postalCode === addressBody.postalCode);
    if (!existingAddress) throw createError(403, "address doesnt exist");
    const output = allAddress.filter(address => address.postalCode !== addressBody.postalCode || address.address !== addressBody.addressLine);
    const addressesLine = [];
    const postalCode = [];
    output.forEach(address => {
        addressesLine.push(address.address);
        postalCode.push(address.postalCode);
    });
    return await prisma.client.update({
        where: { userId },
        data: {
            Addresses: addressesLine,
            postalCode: postalCode,
        }
    });
}

// Update an existing shipping address or postal code for a user
export async function editAddress(body, userId) {
    const { address, changes } = body;
    const client = await prisma.client.findUnique({
        where: { userId },
        select: { Addresses: true, postalCode: true },
    });
    if (!client) throw createError(404, "client profile not found");
    const index = client.Addresses.findIndex((addressLine, i) =>
        addressLine === address.addressLine && client.postalCode[i] === address.postalCode
    );
    if (index === -1) throw createError(404, "address not found");

    const newAddressLine = changes.addressLine ?? client.Addresses[index];
    const newPostalCode = changes.postalCode ?? client.postalCode[index];

    if (newAddressLine === client.Addresses[index] && newPostalCode === client.postalCode[index]) {
        throw createError(400, "no changes detected");
    }

    const duplicate = client.Addresses.some((a, i) => i !== index && a === newAddressLine) || client.postalCode.some((p, i) => i !== index && p === newPostalCode);
    if (duplicate) throw createError(409, "address or postal code already exists");

    const Addresses = [...client.Addresses];
    const postalCode = [...client.postalCode];
    Addresses[index] = newAddressLine;
    postalCode[index] = newPostalCode;

    return await prisma.client.update({
        where: { userId },
        data: {
            Addresses: Addresses,
            postalCode: postalCode
        },
        select: { Addresses: true, postalCode: true },
    });
}

// Add a product to client favorites list
export async function addFavourite(clientId, productId) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
    });
    if (!product) throw createError(404, "product not found");

    const exists = await prisma.favouriteProducts.findUnique({
        where: { clientId_productId: { clientId, productId } },
    });

    if (exists) throw createError(401, 'already exists');
    await prisma.favouriteProducts.create({ data: { clientId, productId } });
}

// Remove a product from client favorites list
export async function removeFavourite(clientId, productId) {
    const exists = await prisma.favouriteProducts.findUnique({
        where: { clientId_productId: { clientId, productId } },
        select: { productId: true },
    });
    if (!exists) throw createError(404, "product is not in your favourites");

    await prisma.favouriteProducts.delete({
        where: { clientId_productId: { clientId, productId } },
    });
}

// Delete all favorite products for a client
export async function clearFavourites(clientId) {
    const { count } = await prisma.favouriteProducts.deleteMany({
        where: { clientId },
    });
    return count;
}

// Retrieve all favorite products with details for a client
export async function getFavourites(clientId) {
    return await prisma.favouriteProducts.findMany({
        where: { clientId },
        select: {
            product: {
                select: { id: true, productName: true, rating: true, images: true },
            },
        },
        orderBy: { productId: 'desc' },
    });
}

// Look up shopping cart ID for a given user ID
export async function getShoppingCartIdWithUserId(userId) {
    const shoppingCart = await prisma.shoppingCart.findFirst({
        where: { client: { userId: userId } },
        select: { id: true }
    });
    if (!shoppingCart) throw createError(404, "shopping cart not found");
    return shoppingCart.id;
}

// Retrieve active seller inventory listing by ID
async function getActiveListing(sellerInventoryId) {
    const listing = await prisma.sellerInventory.findUnique({
        where: { id: sellerInventoryId },
        select: { isActive: true, quantity: true },
    });
    if (!listing || !listing.isActive) throw createError(404, "listing not found");
    return listing;
}

// Find a cart item by shopping cart ID and inventory listing ID
async function getcartItem(shoppingCartId, sellerInventoryId) {
    const exists = await prisma.cartItem.findUnique({
        where: { shoppingCartId_sellerInventoryId: { shoppingCartId, sellerInventoryId } },
    });
    return exists;
}

// Add an inventory listing to the client's shopping cart
export async function addCartItem(shoppingCartId, sellerInventoryId, userId) {
    const listing = await prisma.sellerInventory.findUnique({
        where: { id: sellerInventoryId },
        select: {
            isActive: true,
            quantity: true,
            seller: { select: { userId: true } },
        },
    });

    if (!listing || !listing.isActive) throw createError(404, "listing not found");
    if (listing.seller.userId === userId) {
        throw createError(403, "you cannot add your own listing to your cart");
    }
    if (listing.quantity <= 0) throw createError(409, "item is out of stock");

    const exists = await getcartItem(shoppingCartId, sellerInventoryId);
    if (exists) throw createError(409, "item already exists in cart");

    return await prisma.cartItem.create({
        data: { quantity: 1, shoppingCartId, sellerInventoryId },
    });
}

// Remove an item from the shopping cart
export async function removeCartItem(shoppingCartId, sellerInventoryId) {
    const exists = await getcartItem(shoppingCartId, sellerInventoryId);
    if (!exists) throw createError(404, "item not found in cart");

    return await prisma.cartItem.delete({
        where: { shoppingCartId_sellerInventoryId: { shoppingCartId, sellerInventoryId } },
    });
}

// Remove all items from a shopping cart
export async function clearCart(shoppingCartId) {
    const { count } = await prisma.cartItem.deleteMany({
        where: { shoppingCartId },
    });
    return count;
}

// Increment the quantity of an item in the shopping cart
export async function incrementquantityToCartItem(shoppingCartId, sellerInventoryId) {
    const exists = await getcartItem(shoppingCartId, sellerInventoryId);
    if (!exists) throw createError(404, "item not found in cart");

    const listing = await getActiveListing(sellerInventoryId);
    if (exists.quantity >= listing.quantity || !listing.isActive) throw createError(400, "cannot add more than available stock or item is inactive");
    return await prisma.cartItem.update({
        where: { shoppingCartId_sellerInventoryId: { shoppingCartId, sellerInventoryId } },
        data: { quantity: { increment: 1 } },
    });
}

// Decrement item quantity in cart or remove it if quantity reaches zero
export async function decrementquantityToCartItem(shoppingCartId, sellerInventoryId) {
    const exists = await getcartItem(shoppingCartId, sellerInventoryId);
    if (!exists) throw createError(404, "item not found in cart");

    const listing = await getActiveListing(sellerInventoryId);
    if (exists.quantity <= 1) {
        await removeCartItem(shoppingCartId, sellerInventoryId);
        return 'item removed from cart as quantity reached zero';
    }

    return await prisma.cartItem.update({
        where: { shoppingCartId_sellerInventoryId: { shoppingCartId, sellerInventoryId } },
        data: { quantity: { decrement: 1 } },
    });
}

// Retrieve all in-stock active items in a shopping cart with product details
export async function getCartItems(shoppingCartId) {
    const allitems = await prisma.cartItem.findMany({
        where: {
            shoppingCartId,
            sellerInventory: { isActive: true, quantity: { gt: 0 } }
        },
        select: {
            quantity: true,
            sellerInventoryId: true,
            sellerInventory: {
                select: {
                    id: true,
                    price: true, condition: true,
                    product: { select: { productName: true, images: true } },
                }
            }
        }
    });
    console.log(allitems);

    const sanatizedActiveCartItems = allitems.map(items => {
        return {
            listingId: items.sellerInventory.id,
            productName: items.sellerInventory.product.productName,
            quantity: items.quantity,
            price: items.sellerInventory.price,
            condition: items.sellerInventory.condition,
            images: items.sellerInventory.product.images
        };
    });
    return sanatizedActiveCartItems;
}
