
import createError from "http-errors";
import {prismaPool} from "../../helper/helper.js";

const prisma = prismaPool

export async function seeSellerRequests() {
    let sellers = await prisma.seller.findMany({
        where: {verified: false},
        select: {
            user : { select: { id: true , userName : true , email : true , phoneNumber : true }, },
            storeName : true,
            verified: true,
            id: true
        }
    })
    if (sellers.length === 0) {sellers = "there are no unverified sellers"}
    return sellers
}

export async function verifySeller(userId) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(404, 'seller profile not found');
    if (seller.verified) throw createError(409, 'seller is already verified');

    return prisma.seller.update({
        where: { userId },
        data: { verified: true },
    });
}

export async function revokeSeller(userId) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(404, 'seller not found');

    await prisma.seller.delete({ where: { userId } });
}

export async function unverifySeller(userId) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(404, 'seller not found');

    return await prisma.seller.update({
        where: { userId },
        data: { verified: false },
    })
}

export async function addcategory(body) {
    const exist = await prisma.productCategory.findUnique({
        where: {categoryName : body.categoryName}
    })
    if (exist) {
        throw createError(400, 'categoryName already exists');
    }
    return await prisma.productCategory.create({
        data: { categoryName : body.categoryName },
    })
}

export async function detectRepeatedProduct(){
    const repeatedProduct = await prisma.product.findMany({
        where : {
            
        }
    })
}

// async function makeAdmin(userId) {
//     const user = await prisma.admin.create({
//         data: {userId : userId}
//     })
//     if (!user) {throw createError(400, 'somthing went wrong.');}
//     return user;
// }
//
// await makeAdmin(2)