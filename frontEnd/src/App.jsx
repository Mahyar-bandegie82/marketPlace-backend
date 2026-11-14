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
        <Route
          path="cart"
          element={<ProtectedRoute><CartPage /></ProtectedRoute>}
        />
        <Route
          path="favourites"
          element={<ProtectedRoute><FavouritesPage /></ProtectedRoute>}
        />
        <Route
          path="orders"
          element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
        />
        <Route
          path="checkout"
          element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
        />
        <Route
          path="profile"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path="seller"
          element={<ProtectedRoute><SellerPage /></ProtectedRoute>}
        />
        <Route
          path="comments"
          element={<ProtectedRoute><CommentsPage /></ProtectedRoute>}
        />
        <Route
          path="admin"
          element={<ProtectedRoute><AdminPage /></ProtectedRoute>}
        />
      </Route>
    </Routes>
  );
}
