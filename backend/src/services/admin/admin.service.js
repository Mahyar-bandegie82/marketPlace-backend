import createError from "http-errors";
import { prismaPool } from "../../helper/helper.js";

const prisma = prismaPool;

// Retrieve unverified seller registration requests
export async function seeSellerRequests() {
    let sellers = await prisma.seller.findMany({
        where: { verified: false },
        select: {
            user: { select: { id: true, userName: true, email: true, phoneNumber: true }, },
            storeName: true,
            verified: true,
            id: true
        }
    });
    if (sellers.length === 0) { sellers = "there are no unverified sellers"; }
    return sellers;
}

// Verify and approve a seller account
export async function verifySeller(userId) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(404, 'seller profile not found');
    if (seller.verified) throw createError(409, 'seller is already verified');

    return prisma.seller.update({
        where: { userId },
        data: { verified: true },
    });
}

// Delete a seller profile by user ID
export async function revokeSeller(userId) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(404, 'seller not found');

    await prisma.seller.delete({ where: { userId } });
}

// Revoke verification status from a seller account
export async function unverifySeller(userId) {
    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(404, 'seller not found');

    return await prisma.seller.update({
        where: { userId },
        data: { verified: false },
    });
}

// Add a new unique product category
export async function addcategory(body) {
    const exist = await prisma.productCategory.findUnique({
        where: { categoryName: body.categoryName }
    });
    if (exist) {
        throw createError(400, 'categoryName already exists');
    }
    return await prisma.productCategory.create({
        data: { categoryName: body.categoryName },
    });
}

// Retrieve all product categories with product counts
export async function getAllCategories() {
    const categories = await prisma.productCategory.findMany({
        orderBy: { id: 'asc' },
        select: {
            id: true,
            categoryName: true,
            _count: {
                select: { product: true },
            },
        },
    });
    return categories.map(({ id, categoryName, _count }) => ({
        id,
        categoryName,
        productCount: _count?.product ?? 0,
    }));
}

// Update the status of an order
export async function updateorderStatus(orderId, status) {
    const order = await prisma.order.update({
        where: { id: orderId },
        data: { orderStatus: status }
    });
    if (!order) throw createError(404, "order not found");
    return order;
}

// Retrieve users who have not completed OTP verification
export async function getNonOtpVerifiedUsers() {
    const users = await prisma.user.findMany({
        where: { otpVerified: false },
        select: {
            userName: true, phoneNumber: true, email: true,
            otpVerified: true, dateCreated: true
        }
    });
    if (users.length <= 0) throw createError(400, "there is no non otp verified users");
    return users;
}

// Delete unverified user accounts older than thirty days
export async function delete30DaysOldNonOtpVerifiedUsers() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { count } = await prisma.user.deleteMany({
        where: {
            otpVerified: false,
            dateCreated: { lt: thirtyDaysAgo },
            admin: null, client: null, seller: null
        }
    });

    return { deletedCount: count, message: `successfully deleted ${count} users` };
}

// Fetch customers marked as loyal sorted by total amount spent
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
    });
    const loyals = clients.map(({ id, amountSpent, user }) => ({
        clientId: id,
        amountSpent,
        ...user
    }));
    return {
        massage: `you hav e${loyals.length} loyal customers`,
        loyals
    };
}

// Fetch customers whose total spending meets or exceeds specified amount
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
    });
    const loyals = clients.map(({ id, amountSpent, user }) => ({
        clientId: id,
        amountSpent,
        ...user
    }));
    return {
        massage: `you hav e${loyals.length} loyal customers`,
        loyals
    };
}

// Fetch all trusted sellers with user details
export async function getAlltrustedSelers() {
    const trustedSellers = await prisma.seller.findMany({
        where: { trusted: true },
        select: {
            id: true,
            storeName: true,
            trusted: true,
            user: {
                select: { userName: true, phoneNumber: true, email: true }
            }
        },
        orderBy: { id: 'desc' }
    });
    return trustedSellers.map(({ id, storeName, trusted, user }) => ({
        sellerId: id,
        storeName,
        trusted,
        ...user
    }));
}

export const getAllTrustedSellers = getAlltrustedSelers;

// Calculate best-selling brands ranked by unit sales and revenue
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
    `;
}

// Retrieve brands ranked by total product count
export async function getBrandsByProductCount(limit = 10) {
    const brands = await prisma.product.groupBy({
        by: ['brand'],
        _count: { _all: true },
        orderBy: { _count: { brand: 'desc' } },
        take: limit
    });

    return brands.map(({ brand, _count }) => ({ brand, products: _count._all }));
}

const allowedTransitions = {
    PROCESSING: ['SHIPPED', 'CANCELED'],
    SHIPPED:    ['DELIVERED', 'RETURNED'],
    DELIVERED:  ['RETURNED', 'REFUNDED'],
    RETURNED:   ['REFUNDED'],
    CANCELED:   [],
    REFUNDED:   []
};

// Validate state transition and update order fulfillment status
export async function changeOrderStatus(orderId, newStatus) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderStatus: true }
    });
    if (!order) throw createError(404, 'Order not found');

    if (!allowedTransitions[order.orderStatus].includes(newStatus)) {
        throw createError(400, `Cannot change order from ${order.orderStatus} to ${newStatus}`);
    }

    const { count } = await prisma.order.updateMany({
        where: { id: orderId, orderStatus: order.orderStatus },
        data: {
            orderStatus: newStatus,
            ...(newStatus === 'DELIVERED' && { deliveredAt: new Date() })
        }
    });
    if (count === 0) throw createError(409, 'Order status was changed by someone else, try again');

    return prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderStatus: true, deliveredAt: true }
    });
}

const adminOrderSelect = {
    id: true,
    orderStatus: true,
    orderDate: true,
    paidAt: true,
    deliveredAt: true,
    address: true,
    postalCode: true,
    client: {
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    userName: true,
                    email: true,
                    phoneNumber: true,
                },
            },
        },
    },
    orderItems: {
        select: {
            listingId: true,
            quantity: true,
            unitPrice: true,
            listing: {
                select: {
                    condition: true,
                    product: { select: { productName: true, brand: true, model: true } },
                    seller: { select: { storeName: true } },
                },
            },
        },
    },
};

function formatAdminOrder(order) {
    const items = (order.orderItems || []).map((item) => ({
        listingId: item.listingId,
        productName: item.listing?.product?.productName || 'Product',
        brand: item.listing?.product?.brand || '',
        model: item.listing?.product?.model || '',
        condition: item.listing?.condition || 'NEW',
        storeName: item.listing?.seller?.storeName || 'Store',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
    }));

    return {
        id: order.id,
        orderStatus: order.orderStatus,
        orderDate: order.orderDate,
        paidAt: order.paidAt,
        deliveredAt: order.deliveredAt,
        address: order.address,
        postalCode: order.postalCode,
        client: {
            clientId: order.client?.id,
            userId: order.client?.user?.id,
            userName: order.client?.user?.userName || 'Unknown',
            email: order.client?.user?.email || '',
            phoneNumber: order.client?.user?.phoneNumber || '',
        },
        items,
        totalAmount: items.reduce((sum, i) => sum + i.lineTotal, 0),
    };
}

// Retrieve all orders for admin optionally filtered by OrderStatus
export async function getAdminOrders(status) {
    const where = status ? { orderStatus: status } : {};
    const orders = await prisma.order.findMany({
        where,
        orderBy: { orderDate: 'desc' },
        select: adminOrderSelect,
    });
    return orders.map(formatAdminOrder);
}

// Retrieve a single order by ID for admin inspection
export async function getAdminOrderById(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        select: adminOrderSelect,
    });
    if (!order) throw createError(404, 'Order not found');
    return formatAdminOrder(order);
}

// Retrieve most-liked comments across all products
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
    });

    return comments.map(({ client, ...comment }) => ({
        ...comment,
        userName: client.user.userName
    }));
}

// Retrieve most-liked comments for a specific product
export async function getMostLikedCommentsForProduct(productId, limit = 10) {
    return prisma.comment.findMany({
        where: { productId },
        orderBy: [{ like: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: { id: true, massage: true, rating: true, like: true, dislike: true, createdAt: true }
    });
}
