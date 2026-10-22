import {PrismaClient} from "@prisma/client"
import createError from "http-errors";
import {getProfile} from "../auth/user.auth.service.js";
const prisma = new PrismaClient()

export async function seeSellerRequests() {
    const sellers = await prisma.seller.findMany({
        where: {verified: false}
    })
    if (sellers.length === 0) {throw createError(400, 'there are no unverified sellers')}
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
// async function makeAdmin(userId) {
//     const user = await prisma.admin.create({
//         data: {userId : userId}
//     })
//     if (!user) {throw createError(400, 'somthing went wrong.');}
//     return user;
// }
//
// await makeAdmin(2)