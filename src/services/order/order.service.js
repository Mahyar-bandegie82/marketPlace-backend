import { prismaPool } from "../../helper/helper.js"
import createError from "http-errors"
import { clearCart, getCartItems } from "../user/user.service.js"

const prisma = prismaPool


export async function createOrder(userId, { address, postalCode }) {
    return prisma.$transaction(async (tx) => {
        const cart = await tx.shoppingCart.findFirst({
            where: { client: { userId } },
            select: { id: true, clientId: true },
        });
        if (!cart) throw createError(404, "cart not found");

        const items = await tx.cartItem.findMany({
            where: { shoppingCartId: cart.id },
            select: {
                quantity: true,
                sellerInventoryId: true,
                sellerInventory: {
                    select: { price: true, isActive: true, seller: { select: { userId: true } } },
                },
            },
        });
        if (items.length === 0) throw createError(400, "shopping cart is empty");

        for (const item of items) {
            const listing = item.sellerInventory;
            if (!listing.isActive) {
                throw createError(409, `listing ${item.sellerInventoryId} is no longer available`);
            }
            if (listing.seller.userId === userId) {
                throw createError(403, "you cannot buy your own listing");
            }

            const { count } = await tx.sellerInventory.updateMany({
                where: {
                    id: item.sellerInventoryId,
                    isActive: true,
                    quantity: { gte: item.quantity },
                },
                data: { quantity: { decrement: item.quantity } },
            });
            if (count === 0) {
                throw createError(409, `not enough stock for listing ${item.sellerInventoryId}`);
            }
        }

        const order = await tx.order.create({
            data: {
                clientId: cart.clientId,
                address,
                postalCode,
                orderItems: {
                    create: items.map((i) => ({
                        listingId: i.sellerInventoryId,
                        quantity: i.quantity,
                        unitPrice: i.sellerInventory.price,
                    })),
                },
            },
            include: { orderItems: true },
        });

        await tx.cartItem.deleteMany({ where: { shoppingCartId: cart.id } });

        return order;
    });
}

export async function cancelOrder(userId, orderId) {
    return prisma.$transaction(async (tx) => {
        const { count } = await tx.order.updateMany({
            where: { id: orderId, orderStatus: 'PROCESSING', client: { userId } },
            data: { orderStatus: 'CANCELED' },
        });

        if (count === 0) {
            const order = await tx.order.findFirst({
                where: { id: orderId, client: { userId } },
                select: { orderStatus: true },
            });
            if (!order) throw createError(404, "order not found");
            throw createError(409, `an order that is ${order.orderStatus} cannot be canceled`);
        }

        // give the stock back
        const items = await tx.orderItems.findMany({
            where: { orderId },
            select: { listingId: true, quantity: true },
        });
        for (const item of items) {
            await tx.sellerInventory.update({
                where: { id: item.listingId },
                data: { quantity: { increment: item.quantity } },
            });
        }

        return { orderId, status: 'CANCELED' };
    });
}

const orderSelect = {
    id: true,
    orderStatus: true,
    orderDate: true,
    paidAt: true,
    deliveredAt: true,
    address: true,
    postalCode: true,
    orderItems: {
        select: {
            listingId: true,
            quantity: true,
            unitPrice: true,
            discountPercent: true,
            listing: {
                select: {
                    condition: true,
                    product: {select: {productName: true, images: true}},
                    seller: {select: {storeName: true}},
                },
            },
        },
    },
};

function toOrderDto(order) {
    const items = order.orderItems.map((i) => ({
        listingId: i.listingId,
        productName: i.listing.product.productName,
        images: i.listing.product.images,
        condition: i.listing.condition,
        storeName: i.listing.seller.storeName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountPercent: i.discountPercent,
        lineTotal: Math.round((i.unitPrice * i.quantity * (100 - i.discountPercent)) / 100),
    }));

    return {
        orderId: order.id,
        status: order.orderStatus,
        orderDate: order.orderDate,
        paidAt: order.paidAt,
        deliveredAt: order.deliveredAt,
        address: order.address,
        postalCode: order.postalCode,
        items : items,
        totalAmount: items.reduce((sum, i) => sum + i.lineTotal, 0),
    };
}

export async function getActiveOrders(userId) {
    const orders = await prisma.order.findMany({
        where: {
            client: {userId},
            orderStatus: {in: ['PROCESSING', 'SHIPPED']},
        },
        orderBy: {orderDate: 'desc'},
        select: orderSelect,
    });

    return orders.map(toOrderDto);
}