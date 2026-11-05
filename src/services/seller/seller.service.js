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

export async function getSellerIdWithUserId(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId, seller: { userId } },
        select: { seller: { select: { id: true } } }
    })
    if (!user || !user.seller.id) throw createError(404, "user not found or user is not a seller");

    return user.seller.id;
}
export async function startPromotion(body, sellerId) {
    const { name, startDate, endDate } = body
    const now = new Date()
    return await prisma.$transaction(async (tx) => {

        await tx.promotionListing.deleteMany({
            where: { promotion: { sellerId, endDate: { lt: now } } }
        })
        await tx.promotions.deleteMany({
            where: { sellerId, endDate: { lt: now } }
        })

        const existingPromotions = await tx.promotions.findMany({
            where: { sellerId },
            select: { name: true }
        })
        if (existingPromotions.length >= 5) throw createError(400, "a seller cant have more than promotion catagories");

        const promotion = await tx.promotions.create({
            data: {
                name: name,
                startDate: startDate,
                endDate: endDate,
                sellerId: sellerId
            }
        })

        return promotion;
    })
}

export async function addListingToPromotion(body, userId) {
    const { promotionId, listingId, discount } = body;
    const sellerId = await getSellerIdWithUserId(userId)
    return await prisma.$transaction(async (tx) => {
        const promotion = await tx.promotions.findFirst({
            where: { id: promotionId, sellerId, endDate: { gte: new Date() } },
            select: { id: true, name: true },
        });
        if (!promotion) throw createError(404, "promotion not found or already expired");

        const listing = await tx.sellerInventory.findFirst({
            where: { id: listingId, sellerId },
            select: { id: true, price: true },
        });
        if (!listing) throw createError(404, "listing not found");

        const alreadyDiscounted = await tx.promotionListing.findFirst({
            where: { listingId, promotion: { endDate: { gte: new Date() } } },
            select: { id: true },
        });
        if (alreadyDiscounted) throw createError(409, "listing is already in an active promotion");

        const addListing = await tx.promotionListing.create({
            data: { promotionId, listingId, discount }
        })

        const addDiscountPrice = await tx.sellerInventory.update({
            where: { id: listingId },
            data: {
                discountedPrice: Math.round(listing.price * (100 - discount) / 100)
            }
        })
        return addListing
    })
}

export async function getPromotions(userId) {
    const sellerId = await getSellerIdWithUserId(userId);
    return prisma.promotions.findMany({
        where: { sellerId },
        orderBy: { endDate: 'desc' },
        select: { id: true, name: true, startDate: true, endDate: true },
    });
}

export async function getPromotionListing(userId, promotionId) {
    const sellerId = await getSellerIdWithUserId(userId);

    // one query: ownership check and listings together
    const promotion = await prisma.promotions.findFirst({
        where: { id: promotionId, sellerId },
        select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            promotionsProducts: {
                select: {
                    listingId: true,
                    discount: true,
                    listing: {
                        select: {
                            price: true,
                            discountedPrice: true,
                            condition: true,
                            product: { select: { productName: true, images: true } },
                        },
                    },
                },
            },
        },
    });
    if (!promotion) throw createError(404, "promotion not found");

    return {
        id: promotion.id,
        name: promotion.name,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        listings: promotion.promotionsProducts.map((p) => ({
            listingId: p.listingId,
            discount: p.discount,
            price: p.listing.price,
            discountedPrice: p.listing.discountedPrice,
            condition: p.listing.condition,
            productName: p.listing.product.productName,
            images: p.listing.product.images,
        })),
    };
}

export async function deletePromotion(userId, promotionId) {
    const seller = await getSellerIdWithUserId(userId)
    return await prisma.$transaction(async (tx) => {
        const promotion = await tx.promotions.findFirst({
            where: { id: promotionId, sellerId },
            select: { id: true },
        })
        if (!promotion) throw createError(404, "promotion not found")

        const listings = await tx.promotionListing.findMany({
            where: { promotionId },
            select: { listingId: true },
        })
        const listingIds = listings.map((listing) => listing.listingId)

        await tx.promotionListing.deleteMany({ where: { promotionId } })
        await tx.promotions.delete({ where: { id: promotionId } })

        await tx.sellerInventory.updateMany({
            where: {
                id: { in: listingIds },
            },
            data: { discountedPrice: 0 },
        })
    })
}

export async function deleteListingfromPromotion(userId, promotionId, listingId) {
    const seller = await getSellerIdWithUserId(userId);
    return await prisma.$transaction(async (tx) => {
        const promotion = await tx.promotions.findUnique({
            where: { id: promotionId },
            select: { sellerId: true }
        })
        if (promotion.sellerId !== seller || !promotion) { throw createError(400, "promotion not found") }

        const { count } = await tx.promotionListing.deleteMany({
            where: { listingId, promotionId },
        })
        if (count === 0) throw createError(400, "listing is not in promotion")

        await tx.sellerInventory.update({
            where: { id: listingId },
            data: {
                discountedPrice: 0
            }
        })
    })
}

export async function updatePromotionListing(userId, body) {
    const seller = await getSellerIdWithUserId(userId);
    const { listingId, promotionId, discount } = body
    return await prisma.$transaction(async (tx) => {
        const pl = await tx.promotionListing.findUnique({
            where: {
                promotionId_listingId: { promotionId, listingId }
            },
            select: {
                promotion: { select: { sellerId: true } }
            }
        })
        if (!pl || pl.promotion.sellerId !== seller) throw createError(402, "promotionListing notfound");
        if (pl.promotion.endDate < new Date()) throw createError(409, "promotion has already expired")

        const listing = await tx.sellerInventory.findUnique({
            where: { id: listingId },
            select: { price: true }
        })
        if (!listing) throw createError(400, "listing doesnt exists")

        await tx.promotionListing.update({
            where: { promotionId_listingId: { promotionId, listingId } },
            data: {
                discount: discount
            }
        })
        await tx.sellerInventory.update({
            where: { id: listingId },
            data: {
                discountedPrice: Math.round((listing.price / 100) * (100 - discount))
            }
        })

        return { promotionId, listingId, discount }
    })
}