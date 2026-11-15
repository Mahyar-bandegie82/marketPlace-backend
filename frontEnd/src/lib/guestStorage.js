const GUEST_CART_KEY = 'mp_guest_cart';
const GUEST_FAV_KEY = 'mp_guest_favourites';

export function getGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart:updated'));
  } catch {
    // ignore storage errors
  }
}

export function addGuestCartItem(item) {
  const cart = getGuestCart();
  const idx = cart.findIndex((c) => Number(c.listingId) === Number(item.listingId));
  if (idx >= 0) {
    cart[idx].quantity = (cart[idx].quantity || 1) + 1;
  } else {
    cart.push({
      listingId: Number(item.listingId),
      productName: item.productName || `Listing #${item.listingId}`,
      price: Number(item.price) || 0,
      condition: item.condition || 'NEW',
      images: item.images || [],
      quantity: 1,
    });
  }
  saveGuestCart(cart);
  return cart;
}

export function incrementGuestCartItem(listingId) {
  const cart = getGuestCart().map((item) =>
    Number(item.listingId) === Number(listingId)
      ? { ...item, quantity: item.quantity + 1 }
      : item
  );
  saveGuestCart(cart);
  return cart;
}

export function decrementGuestCartItem(listingId) {
  const cart = getGuestCart()
    .map((item) =>
      Number(item.listingId) === Number(listingId)
        ? { ...item, quantity: item.quantity - 1 }
        : item
    )
    .filter((item) => item.quantity > 0);
  saveGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(listingId) {
  const cart = getGuestCart().filter((item) => Number(item.listingId) !== Number(listingId));
  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart() {
  saveGuestCart([]);
  return [];
}

export function getGuestFavourites() {
  try {
    const raw = localStorage.getItem(GUEST_FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestFavourites(favs) {
  try {
    localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(favs));
  } catch {
    // ignore
  }
}

export function addGuestFavourite(product) {
  const favs = getGuestFavourites();
  if (!favs.some((f) => Number(f.product?.id) === Number(product.id))) {
    favs.push({
      product: {
        id: product.id,
        productName: product.productName || `Product #${product.id}`,
        brand: product.brand || '',
        model: product.model || '',
        rating: product.rating || 0,
        images: product.images || [],
      },
    });
    saveGuestFavourites(favs);
  }
  return favs;
}

export function removeGuestFavourite(productId) {
  const favs = getGuestFavourites().filter((f) => Number(f.product?.id) !== Number(productId));
  saveGuestFavourites(favs);
  return favs;
}

export function clearGuestFavourites() {
  saveGuestFavourites([]);
  return [];
}
