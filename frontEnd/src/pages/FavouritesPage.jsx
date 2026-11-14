import { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { Button, Card, LoadingSpinner, EmptyState, Badge } from '../components/ui/Shared.jsx';
import { Heart, Trash2, ShoppingCart, Star, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchFavourites = async () => {
    try {
      const res = await api.get('/users/readFavoritedItems');
      setFavourites(res.data.favourites || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load favourites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFavourites(); }, []);

  const handleRemove = async (productId) => {
    setActionLoading(productId);
    try {
      await api.delete(`/users/deletefavoritedItem/${productId}`);
      toast.success('Removed from wishlist');
      fetchFavourites();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    } finally { setActionLoading(null); }
  };

  const handleClear = async () => {
    try {
      await api.delete('/users/clearfavoritedItems');
      toast.success('Wishlist cleared');
      setFavourites([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clear');
    }
  };

  if (loading) return <LoadingSpinner text="Loading wishlist..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Heart className="text-pink-500" /> Wishlist
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{favourites.length} saved item{favourites.length !== 1 ? 's' : ''}</p>
        </div>
        {favourites.length > 0 && (
          <Button variant="ghost" onClick={handleClear} size="sm">
            <Trash2 size={14} /> Clear All
          </Button>
        )}
      </div>

      {favourites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love to find them later"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favourites.map(({ product }) => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {product.images && product.images.length > 0 && typeof product.images[0] === 'string' ? (
                  <img src={product.images[0]} alt={product.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Package className="text-gray-400" size={40} />
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{product.productName}</h3>
                {product.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">{product.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(product.id)}
                    loading={actionLoading === product.id}
                  >
                    <Trash2 size={14} /> Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
