import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma';

// Define CASL authorization permissions and rules based on user role and attributes
export function defineAbilityFor(user) {
    const { can, cannot, build } = new AbilityBuilder(createPrismaAbility);

    can('read', 'Product');
    can('read', 'ProductCategory');
    can('read', 'SellerInventory', { isActive: true });
    can('read', 'Seller', ['id', 'storeName', 'trusted']);
    can('read', 'Comment');
    can('read', 'Promotions');
    can('read', 'PromotionListing');

    if (!user) return build();

    can('read', 'User', ['id', 'userName', 'email', 'phoneNumber'], { id: user.id });
    can('update', 'User', ['userName', 'email', 'phoneNumber', 'password'], { id: user.id });

    const { admin, client, seller } = user;

    if (client) {
        can('read', 'Client', { id: client.id });
        can('update', 'Client', ['Addresses', 'postalCode'], { id: client.id });
        can('delete', 'Client', ['Addresses', 'postalCode'], { id: client.id });
        can('create', 'Client', ['Addresses', 'postalCode'], { id: client.id });
        can('read', 'Client', ['Addresses', 'postalCode'], { id: client.id });

        cannot('manage', 'ShoppingCart', { clientId: client.id });
        can('manage', 'CartItem', { shoppingCart: { clientId: client.id } });
        can('create', 'FavouriteProducts', { clientId: client.id });
        can('delete', 'FavouriteProducts', { clientId: client.id });
        can('read', 'FavouriteProducts', { clientId: client.id });

        can('create', 'Comment', { clientId: client.id });
        can('update', 'Comment', ['massage', 'images', 'videos'], { clientId: client.id });
        can('delete', 'Comment', { clientId: client.id });
        can('react', 'Comment');

        can('create', 'Seller');

        can('read', 'Order', { clientId: client.id });
        can('read', 'OrderItems', { order: { clientId: client.id } });

        if (user.otpVerified) {
            can('create', 'Order', { clientId: client.id });
            can('update', 'Order', { clientId: client.id, orderStatus: { in: ['PROCESSING'] } });
            can('cancel', 'Order', {
                clientId: client.id,
                orderStatus: { in: ['PROCESSING'] },
            });
            can('create', 'OrderItems');
        }
    }

    if (seller) {
        can('read', 'Seller', { id: seller.id });
        can('update', 'Seller', ['storeName'], { id: seller.id });

        if (seller.verified) {
            can('create', 'SellerInventory', { sellerId: seller.id });
            can('delete', 'SellerInventory', { sellerId: seller.id });
            can('read', 'SellerInventory', { sellerId: seller.id });
            can('update', 'SellerInventory', ['quantity', 'price', 'condition', 'isActive', 'productWaranty'], { sellerId: seller.id });
            can('create', 'Promotions', { sellerId: seller.id });
            can('read', 'Promotions', { sellerId: seller.id });
            can('delete', 'Promotions', { sellerId: seller.id });
            can('create', 'PromotionListing', { sellerId: seller.id });
            can('delete', 'PromotionListing', { sellerId: seller.id });
            can('update', 'PromotionListing', { sellerId: seller.id });
            can('read', 'PromotionListing', { sellerId: seller.id });
        }

        cannot('create', 'OrderItems', { listing: { sellerId: seller.id } });
    }

    if (admin && user.otpVerified) {
        can(['read', 'verify', 'trust', 'delete', 'unverify'], 'Seller');
        can('read', 'SellerInventory');
        can('update', 'SellerInventory', ['isActive']);
        can('manage', ['Product', 'ProductCategory', 'Promotions', 'PromotionListing']);
        can(['read', 'update', 'cancel'], 'Order');
        can('read', 'OrderItems');
        can(['read', 'delete'], 'User');
        can('read', 'Client');
        can(['read', 'delete'], 'Comment');
    }

    return build();
}
