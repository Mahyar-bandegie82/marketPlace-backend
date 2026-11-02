import { prismaPool } from "../../helper/helper.js"
import createError from "http-errors"
import { clearCart, getCartItems } from "../user/user.service.js"

const prisma = prismaPool


export async function createOrder(body) {
    const { postalCode, address, clientId } = body

    const resualt = await prisma.$transaction(async (tx) => {
        const usersCartId = await tx.user.findUnique({
            where: { id: userId },
            select: {
                client: { select: { shoppingCartId: { select: { id: true } } } }
            }
        })
        const order = await tx.order.create({
            data: {
                postalCode,
                address,
                clientId
            }
        })
        const cartItems = await getCartItems(usersCartId.client.shoppingCartId.id)
        if (!cartItems || cartItems.length === 0) {
            throw createError(400, "Cart is empty")
        }
        const orderItems = cartItems.map(async (item) => {
            return await tx.orderItems.create({
                data: {
                    unitPrice: item.price,
                    quantity: item.quantity,
                    orderId: order.id,
                    listingId : item.listingId
                }
            })
        })
        await clearCart(usersCartId.client.shoppingCartId.id);
    })

    return resualt;
}