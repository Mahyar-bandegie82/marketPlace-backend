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
    const sellerExist = await  prisma.seller.findUnique({
        where: {userId: userId},
    })
    if (sellerExist) throw createError(404, 'a profile with this information already exists')
    return await prisma.seller.create({
        data : {
            storeName : body.storeName,
            userId : userId,
        }
    })
}

export async function addToInventory(sellerId, body) {
    const { productId, product, quantity, price, condition, productWaranty } = body;

    return prisma.$transaction(async tx => {
        let id = productId;
        console.log(sellerId, body);
        if (id === undefined) {
            const created = await tx.product.create({
                data: {
                    productName: product.productName,
                    description: product.description,
                    attributes: product.attributes,
                    images: product.images,
                    videos: product.videos,
                    categories: {
                        connect: product.categories.map(categoryName => ({ categoryName })),
                    },
                },
            });
            id = created.id;
        } else {
            const existing = await tx.product.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!existing) throw createError(404, "product not found");
        }

        return tx.sellerInventory.create({
            data: { sellerId, productId: id, quantity, price, condition, productWaranty },
            include: { product: true },
        });
    });
}
export async function deleteListing(listingId, sellerId){
    const resault = await prisma.sellerInventory.updateMany({
        where : {id : listingId, sellerId : sellerId, isActive : true},
        data : {isActive : false}
    })
    if (resault.count === 0) throw createError(404, "listing not found");
}