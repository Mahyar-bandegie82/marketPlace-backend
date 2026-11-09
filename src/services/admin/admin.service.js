import createError from "http-errors";
import { prismaPool } from "../../helper/helper.js";

const prisma = prismaPool

export async function seeSellerRequests() {
    let sellers = await prisma.seller.findMany({
        where: { verified: false },
        select: {
            user: { select: { id: true, userName: true, email: true, phoneNumber: true }, },
            storeName: true,
            verified: true,
            id: true
        }
    })
    if (sellers.length === 0) { sellers = "there are no unverified sellers" }
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
        where: { categoryName: body.categoryName }
    })
    if (exist) {
        throw createError(400, 'categoryName already exists');
    }
    return await prisma.productCategory.create({
        data: { categoryName: body.categoryName },
    })
}

export async function detectRepeatedProduct() {
    const repeatedProduct = await prisma.product.findMany({
        where: {

        }
    })
}

export async function updateorderStatus(orderId, status) {
    const order = await prisma.order.update({
        where: { id: orderId },
        data: { orderStatus: status }
    })
    if (!order) throw createError(404, "order not found");
    return order;
}

export async function getNonOtpVerifiedUsers() {
    const users = await prisma.user.findMany({
        where: { otpVerified: false },
        select: {
            userName: true, phoneNumber: true, email: true,
            otpVerified: true, dateCreated: true
        }
    })
    if (users.length <= 0) throw createError(400, "there is no non otp verified users");

    return users
}

export async function delete30DaysOldNonOtpVerifiedUsers() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const { count } = await prisma.user.deleteMany({
        where: {
            otpVerified: false,
            dateCreated: { lt: thirtyDaysAgo },
            admin: null, client: null, seller: null
        }
    });

    return { deletedCount: count, message: `successfully deleted ${count} users` }
}

export async function getLoyalCustomers() {
    const clients = await prisma.client.findMany({
        where: { loyalCustomer: true },
        select: {
            id: true,
            amountSpent: true,
            user: {
                select: { userName: true, phoneNumber: true, email: true }
            }
        },
        orderBy: { amountSpent: 'desc' }
    })
    const loyals = clients.map(({ id, amountSpent, user }) => ({
        clientId: id,
        amountSpent,
        ...user
    }))
    return {
        massage: `you hav e${loyals.length} loyal customers`,
        loyals
    }
}