import createError from "http-errors";
import {getProfile} from "../auth/user.auth.service.js";
import bcrypt from "bcrypt";

import {prismaPool} from "../../helper/helper.js";

const prisma = prismaPool

// if seller doesn't have account they will be forced to log in or create an account
export async function sellerSignUp(userId, body) {
    const user = await getProfile(userId);
    if (!user) throw createError(404, 'user not found')
    if (user.userName !== body.userName && user.email !== body.email) throw createError(403, 'invalid credentials')
    const password = await bcrypt.compare(body.password, user.password);
    if (!password) throw createError(403, 'invalid credentials')
    const sellerExist = await prisma.seller.findUnique({
        where: {userId: userId},
    })
    if (sellerExist) throw createError(404, 'a profile with this information already exists')
    return await prisma.seller.create({
        data: {
            storeName: body.storeName,
            userId: userId,
        }
    })
}

export async function addToInventory(sellerId, body) {
    const {productId, product, quantity, price, condition, productWaranty} = body;

    return prisma.$transaction(async tx => {
        let id = productId;
        console.log(sellerId, body);
        if (id === undefined) {
            const existingProduct = await tx.product.findUnique({
                where: { model_brand: { model: product.model, brand: product.brand } },
            })
            if(existingProduct){
                throw createError(409, "product with this model and brand already exists")
            }
            const created = await tx.product.create({
                data: {
                    productName: product.productName,
                    model: product.model,
                    brand: product.brand,
                    description: product.description,
                    attributes: product.attributes,
                    images: product.images,
                    videos: product.videos,
                    categories: {
                        connect: product.categories.map(categoryName => ({categoryName})),
                    },
                },
            });
            id = created.id;
        } else {
            const existing = await tx.product.findUnique({
                where: {id},
                select: {id: true},
            });
            if (!existing) throw createError(404, "product not found");
        }
        const repeated = await tx.sellerInventory.findUnique({
            where : {
                sellerId_productId_condition: {sellerId, productId: id, condition}
            }
        })
        if (repeated) throw createError(409, "you already have a listing for this product");
        return tx.sellerInventory.create({
            data: {sellerId, productId: id, quantity, price, condition, productWaranty},
            include: {product: true},
        });
    });
}

export async function deleteListing(listingId, sellerId) {
    const resault = await prisma.sellerInventory.updateMany({
        where: {id: listingId, sellerId: sellerId, isActive: true},
        data: {isActive: false}
    })
    if (resault.count === 0) throw createError(404, "listing not found");
}

export async function updateListing(listingId, sellerId, body) {
    let {quantity, price, condition} = body;

    const listing = await prisma.sellerInventory.findUnique({
        where: {id: listingId, sellerId: sellerId, isActive: true},
    })
    if (!listing) throw createError(404, 'product not found');

    quantity = quantity ?? listing.quantity;
    price = price ?? listing.price;
    condition = condition ?? listing.condition;

    return await prisma.sellerInventory.update({
        where: {id: listing.id},
        data: {quantity, price, condition},
        select: {
            product: {select: {productName: true,}},
            quantity: true,
            price: true,
            condition: true,
            isActive: true,
        }
    })
}

export async function getListing(listingId, sellerId) {
    const listing = await prisma.sellerInventory.findUnique({
        where: {id: listingId, sellerId: sellerId},
        select: {
            quantity: true, price: true, condition: true, isActive: true, productWaranty: true,
            product: {
                select: {
                    productName: true, description: true, rating: true,
                    attributes: true, images: true, videos: true
                },
            }
        }
    })
    if (!listing) throw createError(404, "listing not found");
    return listing;
}

export async function getAllListing(sellerId) {
    return await prisma.sellerInventory.findMany({
        where : {sellerId: sellerId},
        select: {
            quantity: true, price: true, condition: true, isActive: true, productWaranty: true,
            product: {
                select: {
                    productName: true, description: true, rating: true,
                    attributes: true, images: true, videos: true
                },
            }
        },
    })
}