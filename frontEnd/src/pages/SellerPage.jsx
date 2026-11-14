import { useState, useEffect } from 'react';
import api from '../lib/api.js';
import { Button, Input, Card, LoadingSpinner, EmptyState, Badge } from '../components/ui/Shared.jsx';
import { Store, Plus, Trash2, Edit3, Package, Tag, Megaphone, ChevronRight, Save, X, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

function SellerSignup({ onSuccess }) {
  const [form, setForm] = useState({ userName: '', password: '', email: '', storeName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/seller/sellerSignUp', form);
      toast.success('Seller application submitted!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25">
          <Store size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Become a Seller</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Verify your identity to start selling</p>
      </div>
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Username" value={form.userName} onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))} placeholder="Your account username" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Your account email" />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Your account password" />
          <Input label="Store Name" value={form.storeName} onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))} placeholder="My Awesome Store" />
          <Button type="submit" loading={loading} className="w-full"><Store size={16} /> Apply as Seller</Button>
        </form>
      </Card>
    </div>
  );
}

function AddListingModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [form, setForm] = useState({
    productId: '', quantity: '', price: '', condition: 'NEW',
    warrantyCorp: '', warrantyTime: '',
    product: { productName: '', model: '', brand: '', description: '', categories: '', attributes: '{}', images: '', videos: '' },
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { quantity: Number(form.quantity), price: Number(form.price), condition: form.condition };
      
      if (form.warrantyCorp && form.warrantyTime) {
        data.productWaranty = {
          corp: form.warrantyCorp,
          time: new Date(form.warrantyTime).toISOString(),
        };
      }

      if (mode === 'existing') {
        data.productId = Number(form.productId);
      } else {
        data.product = {
          productName: form.product.productName.toLowerCase().trim(),
          model: form.product.model.toLowerCase().trim(),
          brand: form.product.brand.toLowerCase().trim(),
          description: form.product.description.trim(),
          categories: form.product.categories.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
          attributes: JSON.parse(form.product.attributes || '{}'),
          images: form.product.images ? form.product.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
          videos: form.product.videos ? form.product.videos.split(',').map((s) => s.trim()).filter(Boolean) : [],
        };
      }
      await api.post('/seller/addListing', data);
      toast.success('Listing added!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add listing');
    } finally {
      setLoading(false);
    }
  };

  const inputHandler = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const productHandler = (key) => (e) => setForm((f) => ({ ...f, product: { ...f.product, [key]: e.target.value } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Listing</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="flex gap-2 mb-6">
          <Button variant={mode === 'existing' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('existing')}>Existing Product ID</Button>
          <Button variant={mode === 'new' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('new')}>New Product Definition</Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'existing' ? (
            <Input label="Product ID" type="number" value={form.productId} onChange={inputHandler('productId')} placeholder="Enter product ID" required />
          ) : (
            <>
              <Input label="Product Name" value={form.product.productName} onChange={productHandler('productName')} placeholder="Product name" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Model" value={form.product.model} onChange={productHandler('model')} placeholder="e.g. RTX 4090" required />
                <Input label="Brand" value={form.product.brand} onChange={productHandler('brand')} placeholder="e.g. ASUS" required />
              </div>
              <Input label="Description" value={form.product.description} onChange={productHandler('description')} placeholder="Product description" required />
              <Input label="Categories (comma separated)" value={form.product.categories} onChange={productHandler('categories')} placeholder="e.g. electronics, gpu" required />
              <Input label="Image URLs (comma separated)" value={form.product.images} onChange={productHandler('images')} placeholder="https://example.com/image.jpg" />
            </>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Input label="Quantity" type="number" value={form.quantity} onChange={inputHandler('quantity')} placeholder="0" required />
            <Input label="Price ($)" type="number" value={form.price} onChange={inputHandler('price')} placeholder="0" required />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Condition</label>
              <select value={form.condition} onChange={inputHandler('condition')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="NEW">New</option>
                <option value="USED">Used</option>
                <option value="BARELY_USED">Barely Used</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Input label="Warranty Corporation (optional)" value={form.warrantyCorp} onChange={inputHandler('warrantyCorp')} placeholder="e.g. Asus Care" />
            <Input label="Warranty Expiry (optional)" type="date" value={form.warrantyTime} onChange={inputHandler('warrantyTime')} />
          </div>

          <Button type="submit" loading={loading} className="w-full"><Plus size={16} /> Add Listing</Button>
        </form>
      </Card>
    </div>
  );
}

function PromotionsPanel() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', endDate: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [expandedPromo, setExpandedPromo] = useState(null);
  const [promoListings, setPromoListings] = useState({});
  const [addToPromo, setAddToPromo] = useState({ promotionId: '', listingId: '', discount: '' });
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [newDiscountVal, setNewDiscountVal] = useState('');

  const fetchPromotions = async () => {
    try {
      const res = await api.get('/seller/getPromotions');
      setPromotions(res.data.promotions || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post('/seller/createPromotion', { name: createForm.name, endDate: new Date(createForm.endDate).toISOString() });
      toast.success('Promotion created!');
      setShowCreate(false);
      setCreateForm({ name: '', endDate: '' });
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setCreateLoading(false); }
  };

  const handleExpand = async (promoId) => {
    if (expandedPromo === promoId) { setExpandedPromo(null); return; }
    setExpandedPromo(promoId);
    try {
      const res = await api.get(`/seller/getPromotionListings/${promoId}`);
      setPromoListings((p) => ({ ...p, [promoId]: res.data.promotion }));
    } catch {}
  };

  const handleDeletePromo = async (promoId) => {
    try {
      await api.delete(`/seller/deletePromotion/${promoId}`);
      toast.success('Promotion deleted');
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleAddToPromo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/seller/addListingToPromotion', {
        promotionId: Number(addToPromo.promotionId),
        listingId: Number(addToPromo.listingId),
        discount: Number(addToPromo.discount),
      });
      toast.success('Listing added to promotion!');
      setAddToPromo({ promotionId: '', listingId: '', discount: '' });
      if (expandedPromo) handleExpand(expandedPromo);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleUpdateDiscount = async (promotionId, listingId) => {
    try {
      await api.patch(`/seller/updatePromotionDiscount/${promotionId}/${listingId}`, {
        discount: Number(newDiscountVal),
      });
      toast.success('Discount updated!');
      setEditingDiscountId(null);
      handleExpand(promotionId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update discount');
    }
  };

  const handleRemoveFromPromo = async (promoId, listingId) => {
    try {
      await api.delete(`/seller/deleteListingFromPromotion/${promoId}/${listingId}`);
      toast.success('Removed from promotion');
      handleExpand(promoId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="text-amber-500" size={20} /> Promotions
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> New Promotion
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3">
          <Input label="Promotion Name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Summer Sale" required />
          <Input label="End Date" type="datetime-local" value={createForm.endDate} onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))} required />
          <Button type="submit" size="sm" loading={createLoading}><Save size={14} /> Create</Button>
        </form>
      )}

      {/* Add listing to promotion form */}
      <form onSubmit={handleAddToPromo} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add Listing to Promotion</h3>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Promotion ID" type="number" value={addToPromo.promotionId} onChange={(e) => setAddToPromo((f) => ({ ...f, promotionId: e.target.value }))} placeholder="Promo ID" required />
          <Input label="Listing ID" type="number" value={addToPromo.listingId} onChange={(e) => setAddToPromo((f) => ({ ...f, listingId: e.target.value }))} placeholder="Listing ID" required />
          <Input label="Discount % (1-99)" type="number" value={addToPromo.discount} onChange={(e) => setAddToPromo((f) => ({ ...f, discount: e.target.value }))} placeholder="e.g. 25" required />
        </div>
        <Button type="submit" size="sm" variant="secondary"><Tag size={14} /> Add to Promotion</Button>
      </form>

      {loading ? <LoadingSpinner text="Loading promotions..." /> : promotions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No promotions yet.</p>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div key={promo.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => handleExpand(promo.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{promo.name}</h3>
                    <Badge color="indigo">ID: {promo.id}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(promo.startDate).toLocaleDateString()} → {new Date(promo.endDate).toLocaleDateString()}
                    {new Date(promo.endDate) < new Date() && <Badge color="red" className="ml-2">Expired</Badge>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeletePromo(promo.id); }} className="text-red-500">
                    <Trash2 size={14} />
                  </Button>
                  <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandedPromo === promo.id ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedPromo === promo.id && promoListings[promo.id] && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  {promoListings[promo.id].listings?.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No listings in this promotion.</p>
                  ) : (
                    promoListings[promo.id].listings?.map((item) => (
                      <div key={item.listingId} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{item.productName} (Listing #{item.listingId})</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ${item.price} → <span className="text-green-600 dark:text-green-400 font-bold">${item.discountedPrice}</span> ({item.discount}% off)
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (editingDiscountId === item.listingId) {
                                  setEditingDiscountId(null);
                                } else {
                                  setEditingDiscountId(item.listingId);
                                  setNewDiscountVal(item.discount);
                                }
                              }}
                            >
                              <Percent size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveFromPromo(promo.id, item.listingId)} className="text-red-500">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                        {editingDiscountId === item.listingId && (
                          <div className="flex gap-2 items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                            <Input
                              type="number"
                              value={newDiscountVal}
                              onChange={(e) => setNewDiscountVal(e.target.value)}
                              placeholder="New discount %"
                              className="max-w-[120px]"
                            />
                            <Button size="sm" onClick={() => handleUpdateDiscount(promo.id, item.listingId)}>
                              <Save size={14} /> Update
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingDiscountId(null)}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function SellerPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchListings = async () => {
    try {
      const res = await api.get('/seller/getAllSellerInventory');
      setListings(res.data.listings || []);
      setIsSeller(true);
    } catch (err) {
      if (err.response?.status === 403) setIsSeller(false);
      else toast.error(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const handleDelete = async (listingId) => {
    try {
      await api.delete(`/seller/deleteListing/${listingId}`);
      toast.success('Listing removed');
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleUpdate = async (listingId) => {
    try {
      const data = {};
      if (editForm.quantity !== undefined) data.quantity = Number(editForm.quantity);
      if (editForm.price !== undefined) data.price = Number(editForm.price);
      if (editForm.condition) data.condition = editForm.condition;
      await api.put(`/seller/updateListing/${listingId}`, data);
      toast.success('Listing updated');
      setEditingId(null);
      fetchListings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading seller dashboard..." />;
  if (isSeller === false) return <div className="max-w-lg mx-auto px-4 py-8"><SellerSignup onSuccess={fetchListings} /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Store className="text-emerald-500" /> Seller Dashboard
        </h1>
        <Button onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Listing</Button>
      </div>

      {showAddModal && <AddListingModal onClose={() => setShowAddModal(false)} onSuccess={fetchListings} />}

      {/* Inventory */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Package className="text-indigo-500" size={20} /> Inventory ({listings.length})
        </h2>

        {listings.length === 0 ? (
          <EmptyState icon={Package} title="No listings yet" description="Add your first product listing" />
        ) : (
          <div className="space-y-4">
            {listings.map((listing, index) => {
              const currentListingId = listing.id || (index + 1);
              return (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{listing.product?.productName}</h3>
                        <Badge color="gray">Listing #{currentListingId}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge color={listing.condition === 'NEW' ? 'green' : listing.condition === 'BARELY_USED' ? 'blue' : 'yellow'}>
                          {listing.condition?.replace('_', ' ')}
                        </Badge>
                        <Badge color={listing.isActive ? 'green' : 'red'}>
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Price: ${listing.price?.toLocaleString()} · Stock: {listing.quantity}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(editingId === index ? null : index); setEditForm({ quantity: listing.quantity, price: listing.price, condition: listing.condition }); }}>
                        <Edit3 size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(currentListingId)} className="text-red-500">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  {editingId === index && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-3">
                      <Input label="Quantity" type="number" value={editForm.quantity} onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))} />
                      <Input label="Price ($)" type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} />
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Condition</label>
                        <select value={editForm.condition} onChange={(e) => setEditForm((f) => ({ ...f, condition: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                          <option value="NEW">New</option>
                          <option value="USED">Used</option>
                          <option value="BARELY_USED">Barely Used</option>
                        </select>
                      </div>
                      <Button size="sm" onClick={() => handleUpdate(currentListingId)}><Save size={14} /> Save</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Promotions */}
      <PromotionsPanel />
    </div>
  );
}
