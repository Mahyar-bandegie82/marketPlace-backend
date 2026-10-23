import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma';

/**
 * user = null (guest) or
 * { id, admin: {id}|null, client: {id}|null, seller: {id, verified}|null }
 * Subject names = your Prisma model names.
 */
export function defineAbilityFor(user) {
    const { can, cannot, build } = new AbilityBuilder(createPrismaAbility);

    // ───────────── Guests (everyone, logged in or not) ─────────────
    can('read', 'Product');
    can('read', 'ProductCategory');
    can('read', 'SellerInventory', { isActive: true });
    can('read', 'Seller', ['id', 'storeName', 'trusted']);   // public store info
    can('read', 'Comment');
    can('read', 'Promotions');
    can('read', 'PromotionListing');

    if (!user) return build();

    // ───────────── Any logged-in user: own account ─────────────
    can('read', 'User', ['id', 'userName', 'email', 'phoneNumber'], { id: user.id });
    can('update', 'User', ['userName', 'email', 'phoneNumber', 'password'], { id: user.id });

    const { admin, client, seller } = user;

    // ───────────── Client profile ─────────────
    if (client) {
        can('read', 'Client', { id: client.id });
        // Addresses/postalCode only. NOT loyalCustomer / amountSpent
        can('update', 'Client', ['Addresses', 'postalCode'], { id: client.id });
        can('delete', 'Client', ['Addresses', 'postalCode'], { id: client.id });
        can('create', 'Client', ['Addresses', 'postalCode'], { id: client.id });
        can('read', 'Client', ['Addresses', 'postalCode'], { id: client.id });

        cannot('manage', 'ShoppingCart', { clientId: client.id });
        can('manage', 'CartItem', { shoppingCart: { clientId: client.id } });
        can('create', 'FavouriteProducts', { clientId: client.id });
        can('delete', 'FavouriteProducts', { clientId: client.id });

        can('create', 'Comment', { clientId: client.id });
        can('update', 'Comment', ['massage', 'images', 'videos'], { clientId: client.id });
        can('delete', 'Comment', { clientId: client.id });
        can('react', 'Comment');   // like / dislike someone's comment

        can('create', 'Seller')

        can(['create', 'read'], 'Order', { clientId: client.id });
        can('cancel', 'Order', {
            clientId: client.id,
            orderStatus: { in: ['PENDING_PAYMENT', 'PROCESSING'] },
        });
        can('read', 'OrderItems', { order: { clientId: client.id } });
        can('create', 'OrderItems');   // narrowed by the `cannot` rule below
    }

    if (seller) {
        can('read', 'Seller', { id: seller.id });
        can('update', 'Seller', ['storeName'], { id: seller.id });

        can('read', 'SellerInventory', { sellerId: seller.id });
        if (seller.verified) {
            can('create', 'SellerInventory', { sellerId: seller.id });
        }
        can('update', 'SellerInventory',
            ['quantity', 'price', 'condition', 'isActive', 'productWaranty'],
            { sellerId: seller.id });

        cannot('create', 'OrderItems', { listing: { sellerId: seller.id } });
    }

    // ───────────── Admin profile ─────────────
    if (admin) {
        can(['read', 'verify', 'trust', 'delete, unverify'], 'Seller');
        can('read', 'SellerInventory');                       // all, including inactive
        can('update', 'SellerInventory', ['isActive']);       // take a listing down
        can('manage', ['Product', 'ProductCategory', 'Promotions', 'PromotionListing']);
        can(['read', 'update'], 'Order');
        can('read', 'OrderItems');
        can('delete', 'Comment');                             // moderation
    }

    return build();
}