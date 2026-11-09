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

export async function getUsersWithHighAmountSpent(money) {
    const clients = await prisma.client.findMany({
        where: { amountSpent: { gte: money } },
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

export async function getAlltrustedSelers() {
    const trustedSellers = await prisma.seller.findMany({
        where: { trusted: true },
        select: {
            storeName: true,
            trusted: true,
            user: {
                select: { userName: true, phoneNumber: true, email: true }
            }
        },
        orderBy: { id: 'desc' }
    })
    return trustedSellers.map(({ id, storeName, trusted, user }) => ({
        sellerId: id,
        storeName,
        trusted,
        ...user
    }))
}

export async function getBestSellingBrands(limit = 10) {
    return prisma.$queryRaw`
        SELECT p."brand",
               SUM(oi."quantity")::int AS "unitsSold",
               SUM(oi."quantity" * oi."unitPrice")::int AS revenue
        FROM "OrderItems" oi
        JOIN "Order" o ON o."id" = oi."orderId"
        JOIN "SellerInventory" si ON si."id" = oi."listingId"
        JOIN "Product" p ON p."id" = si."productId"
        WHERE o."orderStatus" NOT IN ('CANCELED', 'REFUNDED', 'RETURNED')
        GROUP BY p."brand"
        ORDER BY "unitsSold" DESC
        LIMIT ${limit}
    `
}

export async function getBrandsByProductCount(limit = 10) {
    const brands = await prisma.product.groupBy({
        by: ['brand'],
        _count: { _all: true },
        orderBy: { _count: { brand: 'desc' } },
        take: limit
    })

    return brands.map(({ brand, _count }) => ({ brand, products: _count._all }))
}

const allowedTransitions = {
    PROCESSING: ['SHIPPED', 'CANCELED'],
    SHIPPED:    ['DELIVERED', 'RETURNED'],
    DELIVERED:  ['RETURNED', 'REFUNDED'],
    RETURNED:   ['REFUNDED'],
    CANCELED:   [],
    REFUNDED:   []
}

export async function changeOrderStatus(orderId, newStatus) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderStatus: true }
    })
    if (!order) throw createError(404, 'Order not found')

    if (!allowedTransitions[order.orderStatus].includes(newStatus)) {
        throw createError(400, `Cannot change order from ${order.orderStatus} to ${newStatus}`)
    }

    const { count } = await prisma.order.updateMany({
        where: { id: orderId, orderStatus: order.orderStatus },
        data: {
            orderStatus: newStatus,
            ...(newStatus === 'DELIVERED' && { deliveredAt: new Date() })
        }
    })
    if (count === 0) throw createError(409, 'Order status was changed by someone else, try again')

    return prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderStatus: true, deliveredAt: true }
    })
}

export async function getMostLikedComments(limit = 10) {
    const comments = await prisma.comment.findMany({
        orderBy: [{ like: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: {
            id: true,
            massage: true,
            rating: true,
            like: true,
            dislike: true,
            createdAt: true,
            product: { select: { id: true, brand: true, model: true, productName: true } },
            client: { select: { user: { select: { userName: true } } } }
        }
    })

    return comments.map(({ client, ...comment }) => ({
        ...comment,
        userName: client.user.userName
    }))
}

export async function getMostLikedCommentsForProduct(productId, limit = 10) {
    return prisma.comment.findMany({
        where: { productId },
        orderBy: [{ like: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: { id: true, massage: true, rating: true, like: true, dislike: true, createdAt: true }
    })
}