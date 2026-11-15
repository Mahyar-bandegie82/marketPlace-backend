import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import ListingsPage from './pages/ListingsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import CartPage from './pages/CartPage.jsx';
import FavouritesPage from './pages/FavouritesPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SellerPage from './pages/SellerPage.jsx';
import CommentsPage from './pages/CommentsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="products" element={<ListingsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="favourites" element={<FavouritesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route
          path="checkout"
          element={
            <ProtectedRoute
              requireVerified={true}
              title="Sign In to Place Your Order"
              description="You can browse and build your cart freely without a token, but an authenticated and OTP-verified account is required to complete checkout and place an order."
            >
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="seller"
          element={
            <ProtectedRoute
              title="Sign In to Become a Seller"
              description="An authenticated account with a valid token is required to register a seller store or manage your seller inventory and promotions."
            >
              <SellerPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
