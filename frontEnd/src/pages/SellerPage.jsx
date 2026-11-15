import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Button,
  Input,
  Card,
  LoadingSpinner,
  EmptyState,
  Badge,
} from '../components/ui/Shared.jsx';
import {
  Store,
  Plus,
  Trash2,
  Edit3,
  Package,
  Tag,
  Megaphone,
  ChevronRight,
  Save,
  X,
  Percent,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  Layers,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Crown,
  Star,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function SellerSignup({ user, onSuccess }) {
  const [form, setForm] = useState({
    userName: user?.userName || '',
    password: '',
    email: user?.email || '',
    storeName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/seller/sellerSignUp', form);
      toast.success('Seller application submitted! Awaiting admin verification.');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit seller application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25">
          <Store size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Become a Seller</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Confirm your account credentials and choose your store name to submit a seller request for administrator approval.
        </p>
      </div>
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Username"
            value={form.userName}
            onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
            placeholder="Your account username"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Your account email"
            required
          />
          <Input
            label="Account Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Confirm your account password"
            required
          />
          <Input
            label="Store Name"
            value={form.storeName}
            onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
            placeholder="e.g. NextGen Hardware Store"
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            <Store size={16} /> Submit Seller Request
          </Button>
        </form>
      </Card>
    </div>
  );
}

function SelectExistingProductModal({ product, existingConditions = [], onClose, onSuccess }) {
  const [form, setForm] = useState({
    quantity: '1',
    price: '',
    condition: 'NEW',
    includeWarranty: false,
    warrantyCorp: '',
    warrantyTime: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const price = Number(form.price);

    if (!Number.isInteger(qty) || qty < 0) {
      return toast.error('Quantity must be a non-negative integer');
    }
    if (!Number.isInteger(price) || price <= 0) {
      return toast.error('Price must be a positive whole number');
    }

    const payload = {
      productId: Number(product.id),
      quantity: qty,
      price,
      condition: form.condition,
    };

    if (form.includeWarranty) {
      if (!form.warrantyCorp.trim() || !form.warrantyTime) {
        return toast.error('Please provide both Warranty Corporation and Warranty Expiration Date');
      }
      if (form.warrantyCorp.trim().length > 30) {
        return toast.error('Warranty corporation name cannot exceed 30 characters');
      }
      payload.productWaranty = {
        corp: form.warrantyCorp.trim(),
        time: new Date(form.warrantyTime).toISOString(),
      };
    }

    setLoading(true);
    try {
      await api.post('/seller/addListing', payload);
      toast.success(`Added "${product.productName}" (${form.condition}) to your store listings!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add product to listings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Selected Database Product #{product.id}
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize mt-0.5">
              {product.productName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-0.5">
              Brand: {product.brand} · Model: {product.model}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {existingConditions.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle size={16} className="flex-shrink-0 text-amber-500 mt-0.5" />
            <div>
              You already have an active listing for this product in condition:{' '}
              <strong>{existingConditions.join(', ')}</strong>. Choose a different condition grade or edit your existing listing in My Store Inventory.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 10"
              required
            />
            <Input
              label="Unit Price ($)"
              type="number"
              min="1"
              step="1"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="e.g. 499"
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Condition
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NEW">NEW</option>
                <option value="BARELY_USED">BARELY USED</option>
                <option value="USED">USED</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.includeWarranty}
                onChange={(e) => setForm((f) => ({ ...f, includeWarranty: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Include Product Warranty (`productWaranty`)
            </label>

            {form.includeWarranty && (
              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <Input
                  label="Warranty Provider (`corp`, max 30 chars)"
                  maxLength={30}
                  value={form.warrantyCorp}
                  onChange={(e) => setForm((f) => ({ ...f, warrantyCorp: e.target.value }))}
                  placeholder="e.g. Official ASUS Care"
                  required={form.includeWarranty}
                />
                <Input
                  label="Warranty Valid Until (`time`)"
                  type="date"
                  value={form.warrantyTime}
                  onChange={(e) => setForm((f) => ({ ...f, warrantyTime: e.target.value }))}
                  required={form.includeWarranty}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              <Plus size={16} /> Add to My Listings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function CreateNewProductAndListingForm({ categories, onSuccess, onBackToCatalog }) {
  const [productForm, setProductForm] = useState({
    productName: '',
    brand: '',
    model: '',
    description: '',
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [attributeRows, setAttributeRows] = useState([{ key: '', value: '' }]);
  const [imageUrls, setImageUrls] = useState(['']);
  const [videoUrls, setVideoUrls] = useState([]);

  const [listingForm, setListingForm] = useState({
    quantity: '1',
    price: '',
    condition: 'NEW',
    includeWarranty: false,
    warrantyCorp: '',
    warrantyTime: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleCategory = (catName) => {
    const normalized = catName.trim().toLowerCase();
    if (!normalized) return;
    setSelectedCategories((prev) =>
      prev.includes(normalized) ? prev.filter((c) => c !== normalized) : [...prev, normalized]
    );
  };

  const handleAddCustomCategory = () => {
    const normalized = customCategory.trim().toLowerCase();
    if (!normalized) return;
    if (!selectedCategories.includes(normalized)) {
      setSelectedCategories((prev) => [...prev, normalized]);
    }
    setCustomCategory('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productName = productForm.productName.trim().toLowerCase();
    const brand = productForm.brand.trim().toLowerCase();
    const model = productForm.model.trim().toLowerCase();
    const description = productForm.description.trim();

    if (productName.length < 2) {
      return toast.error('Product name must be at least 2 characters');
    }
    if (!brand || brand.length > 20) {
      return toast.error('Brand is required and must be at most 20 characters');
    }
    if (!model || model.length > 30) {
      return toast.error('Model is required and must be at most 30 characters');
    }
    if (!description) {
      return toast.error('Product description is required');
    }
    if (selectedCategories.length === 0) {
      return toast.error('Please select at least 1 product category');
    }

    const attributes = {};
    for (const row of attributeRows) {
      const k = row.key.trim();
      const v = row.value.trim();
      if (k && v) {
        attributes[k] = v;
      }
    }

    const images = imageUrls.map((u) => u.trim()).filter(Boolean);
    for (const url of images) {
      if (!/^https?:\/\/.+/i.test(url)) {
        return toast.error(`Invalid image URL "${url}". Must start with http:// or https://`);
      }
    }

    const videos = videoUrls.map((u) => u.trim()).filter(Boolean);
    for (const url of videos) {
      if (!/^https?:\/\/.+/i.test(url)) {
        return toast.error(`Invalid video URL "${url}". Must start with http:// or https://`);
      }
    }

    const quantity = Number(listingForm.quantity);
    const price = Number(listingForm.price);

    if (!Number.isInteger(quantity) || quantity < 0) {
      return toast.error('Quantity must be a non-negative integer');
    }
    if (!Number.isInteger(price) || price <= 0) {
      return toast.error('Price must be a positive integer');
    }

    // Build payload matching addInventorySchema (.xor('productId', 'product'))
    const payload = {
      product: {
        productName,
        brand,
        model,
        description,
        categories: selectedCategories,
        attributes,
        images,
        videos,
      },
      quantity,
      price,
      condition: listingForm.condition,
    };

    if (listingForm.includeWarranty) {
      if (!listingForm.warrantyCorp.trim() || !listingForm.warrantyTime) {
        return toast.error('Please fill in both Warranty Corporation and Warranty Expiration Date');
      }
      if (listingForm.warrantyCorp.trim().length > 30) {
        return toast.error('Warranty corporation must be at most 30 characters');
      }
      payload.productWaranty = {
        corp: listingForm.warrantyCorp.trim(),
        time: new Date(listingForm.warrantyTime).toISOString(),
      };
    }

    setSubmitting(true);
    try {
      await api.post('/seller/addListing', payload);
      toast.success('New product created in database and added to your store listings!');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create product and listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Sparkles size={14} /> Atomic Database Product + Inventory Transaction
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add New Product to Database & Create Listing
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            If the product you want to sell is not in the catalog yet, define the product specifications below and set your initial listing stock and price in a single transaction.
          </p>
        </div>
        {onBackToCatalog && (
          <Button variant="secondary" size="sm" onClick={onBackToCatalog}>
            Browse Existing Database Products
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Product Schema Fields */}
        <div className="space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
              1
            </span>
            Product Catalog Information (`product` Schema)
          </h3>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Input
                label="Product Name (min 2 chars) *"
                value={productForm.productName}
                onChange={(e) => setProductForm((f) => ({ ...f, productName: e.target.value }))}
                placeholder="e.g. ROG Strix GeForce RTX 4090"
                required
              />
            </div>
            <div>
              <Input
                label="Brand (max 20 chars) *"
                maxLength={20}
                value={productForm.brand}
                onChange={(e) => setProductForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="e.g. asus"
                required
              />
            </div>
            <div>
              <Input
                label="Model (max 30 chars, unique per brand) *"
                maxLength={30}
                value={productForm.model}
                onChange={(e) => setProductForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="e.g. rtx-4090-o24g"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Description *
            </label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Provide a comprehensive description of the product, key features, and hardware architecture..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Categories Selection */}
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Categories (Select at least 1) *
            </label>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const name = cat.categoryName.toLowerCase();
                  const isSelected = selectedCategories.includes(name);
                  return (
                    <button
                      type="button"
                      key={cat.id || name}
                      onClick={() => toggleCategory(name)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/25'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-indigo-400'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {cat.categoryName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Category Pills & Optional New Category Input */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomCategory();
                    }
                  }}
                  placeholder="Or type category name..."
                  className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
                <Button type="button" size="sm" variant="secondary" onClick={handleAddCustomCategory}>
                  Add
                </Button>
              </div>

              {selectedCategories.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 ml-2">
                  <span className="text-xs text-gray-500">Selected:</span>
                  {selectedCategories.map((c) => (
                    <Badge key={c} color="indigo" className="capitalize">
                      {c}
                      <button
                        type="button"
                        onClick={() => toggleCategory(c)}
                        className="ml-1.5 hover:text-red-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Technical Attributes Key-Value Builder */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Technical Specifications (`attributes` JSON object)
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAttributeRows((rows) => [...rows, { key: '', value: '' }])}
              >
                <Plus size={14} /> Add Specification Row
              </Button>
            </div>
            <div className="space-y-2">
              {attributeRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) =>
                      setAttributeRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r))
                      )
                    }
                    placeholder="Attribute name (e.g. VRAM, Socket, Color)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      setAttributeRows((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                      )
                    }
                    placeholder="Value (e.g. 24GB GDDR6X, AM5, Matte Black)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                  {attributeRows.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setAttributeRows((rows) => rows.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Image & Video URI Lists */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Image URLs (`images`)
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setImageUrls((urls) => [...urls, ''])}
                >
                  <Plus size={13} /> Add Image URL
                </Button>
              </div>
              {imageUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      setImageUrls((urls) => urls.map((u, i) => (i === idx ? e.target.value : u)))
                    }
                    placeholder="https://example.com/product-image.jpg"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                  {imageUrls.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setImageUrls((urls) => urls.filter((_, i) => i !== idx))}
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Video URLs (`videos`, optional)
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setVideoUrls((urls) => [...urls, ''])}
                >
                  <Plus size={13} /> Add Video URL
                </Button>
              </div>
              {videoUrls.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  No video URLs added. Click &ldquo;+ Add Video URL&rdquo; to attach product showcase videos.
                </p>
              ) : (
                videoUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) =>
                        setVideoUrls((urls) => urls.map((u, i) => (i === idx ? e.target.value : u)))
                      }
                      placeholder="https://example.com/demo-video.mp4"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setVideoUrls((urls) => urls.filter((_, i) => i !== idx))}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Seller Inventory Listing Details */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">
              2
            </span>
            Initial Store Listing Offer (`SellerInventory` Schema)
          </h3>

          <div className="grid sm:grid-cols-3 gap-4">
            <Input
              label="Available Stock Quantity *"
              type="number"
              min="0"
              step="1"
              value={listingForm.quantity}
              onChange={(e) => setListingForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 15"
              required
            />
            <Input
              label="Unit Price ($) *"
              type="number"
              min="1"
              step="1"
              value={listingForm.price}
              onChange={(e) => setListingForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="e.g. 1599"
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Condition Grade *
              </label>
              <select
                value={listingForm.condition}
                onChange={(e) => setListingForm((f) => ({ ...f, condition: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NEW">NEW</option>
                <option value="BARELY_USED">BARELY USED</option>
                <option value="USED">USED</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={listingForm.includeWarranty}
                onChange={(e) =>
                  setListingForm((f) => ({ ...f, includeWarranty: e.target.checked }))
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Include Product Warranty (`productWaranty`)
            </label>

            {listingForm.includeWarranty && (
              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <Input
                  label="Warranty Corporation (`corp`, max 30 chars) *"
                  maxLength={30}
                  value={listingForm.warrantyCorp}
                  onChange={(e) => setListingForm((f) => ({ ...f, warrantyCorp: e.target.value }))}
                  placeholder="e.g. ASUS Official Warranty"
                  required={listingForm.includeWarranty}
                />
                <Input
                  label="Warranty Valid Until (`time`) *"
                  type="date"
                  value={listingForm.warrantyTime}
                  onChange={(e) => setListingForm((f) => ({ ...f, warrantyTime: e.target.value }))}
                  required={listingForm.includeWarranty}
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          {onBackToCatalog && (
            <Button type="button" variant="ghost" onClick={onBackToCatalog}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="lg" loading={submitting}>
            <Plus size={18} /> Create Product & Add to My Listings
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PromotionsPanel({ listings }) {
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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post('/seller/createPromotion', {
        name: createForm.name,
        endDate: new Date(createForm.endDate).toISOString(),
      });
      toast.success('Promotion created!');
      setShowCreate(false);
      setCreateForm({ name: '', endDate: '' });
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create promotion');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExpand = async (promoId, forceRefresh = false) => {
    if (expandedPromo === promoId && !forceRefresh) {
      setExpandedPromo(null);
      return;
    }
    setExpandedPromo(promoId);
    try {
      const res = await api.get(`/seller/getPromotionListings/${promoId}`);
      setPromoListings((p) => ({ ...p, [promoId]: res.data.promotion }));
    } catch {
      // ignore
    }
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
    if (!addToPromo.promotionId || !addToPromo.listingId || !addToPromo.discount) {
      return toast.error('Please select a promotion, a listing, and a discount percentage');
    }
    try {
      await api.post('/seller/addListingToPromotion', {
        promotionId: Number(addToPromo.promotionId),
        listingId: Number(addToPromo.listingId),
        discount: Number(addToPromo.discount),
      });
      toast.success('Listing added to promotion!');
      const targetPromoId = Number(addToPromo.promotionId);
      setAddToPromo({ promotionId: '', listingId: '', discount: '' });
      handleExpand(targetPromoId, true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add listing to promotion');
    }
  };

  const handleUpdateDiscount = async (promotionId, listingId) => {
    try {
      await api.patch(`/seller/updatePromotionDiscount/${promotionId}/${listingId}`, {
        discount: Number(newDiscountVal),
      });
      toast.success('Discount updated!');
      setEditingDiscountId(null);
      handleExpand(promotionId, true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update discount');
    }
  };

  const handleRemoveFromPromo = async (promoId, listingId) => {
    try {
      await api.delete(`/seller/deleteListingFromPromotion/${promoId}/${listingId}`);
      toast.success('Removed from promotion');
      handleExpand(promoId, true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const activeSellerListings = listings.filter((l) => l.isActive);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="text-amber-500" size={20} /> Store Promotions
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Create promotional campaigns (up to 5 active) and apply percentage discounts to your store listings.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> New Promotion
        </Button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3"
        >
          <Input
            label="Promotion Campaign Name"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Summer Hardware Flash Sale"
            required
          />
          <Input
            label="End Date & Time"
            type="datetime-local"
            value={createForm.endDate}
            onChange={(e) => setCreateForm((f) => ({ ...f, endDate: e.target.value }))}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={createLoading}>
              <Save size={14} /> Create Campaign
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Add listing to promotion selector form */}
      <form
        onSubmit={handleAddToPromo}
        className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Assign Store Listing to Promotion
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Promotion
            </label>
            <select
              value={addToPromo.promotionId}
              onChange={(e) => setAddToPromo((f) => ({ ...f, promotionId: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              required
            >
              <option value="">Choose promotion...</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (#{p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Your Listing
            </label>
            <select
              value={addToPromo.listingId}
              onChange={(e) => setAddToPromo((f) => ({ ...f, listingId: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              required
            >
              <option value="">Choose store listing...</option>
              {activeSellerListings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.product?.productName} ({l.condition}) — ${l.price} [#{l.id}]
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Discount % (1–99)"
            type="number"
            min="1"
            max="99"
            value={addToPromo.discount}
            onChange={(e) => setAddToPromo((f) => ({ ...f, discount: e.target.value }))}
            placeholder="e.g. 20"
            required
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          <Tag size={14} /> Apply Promotion Discount
        </Button>
      </form>

      {loading ? (
        <LoadingSpinner text="Loading promotions..." />
      ) : promotions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No promotion campaigns created yet.</p>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              <div
                onClick={() => handleExpand(promo.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{promo.name}</h3>
                    <Badge color="indigo">Campaign #{promo.id}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(promo.startDate).toLocaleDateString()} →{' '}
                    {new Date(promo.endDate).toLocaleDateString()}
                    {new Date(promo.endDate) < new Date() && (
                      <Badge color="red" className="ml-2">
                        Expired
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePromo(promo.id);
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                  <ChevronRight
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      expandedPromo === promo.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>
              {expandedPromo === promo.id && promoListings[promo.id] && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  {promoListings[promo.id].listings?.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No listings assigned to this promotion yet.
                    </p>
                  ) : (
                    promoListings[promo.id].listings?.map((item) => (
                      <div
                        key={item.listingId}
                        className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {item.productName} (Listing #{item.listingId})
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ${item.price} →{' '}
                              <span className="text-green-600 dark:text-green-400 font-bold">
                                ${item.discountedPrice}
                              </span>{' '}
                              ({item.discount}% off)
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
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
                              <Percent size={14} /> Edit %
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveFromPromo(promo.id, item.listingId)}
                            >
                              <Trash2 size={14} /> Remove
                            </Button>
                          </div>
                        </div>

                        {editingDiscountId === item.listingId && (
                          <div className="flex gap-2 items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              value={newDiscountVal}
                              onChange={(e) => setNewDiscountVal(e.target.value)}
                              placeholder="New discount %"
                              className="max-w-[120px]"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDiscount(promo.id, item.listingId)}
                            >
                              <Save size={14} /> Update
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingDiscountId(null)}
                            >
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
  const { user, fetchProfile } = useAuth();
  const [sellerStatus, setSellerStatus] = useState(null); // { isSeller, isVerified, seller }
  const [listings, setListings] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Active tab in verified Seller Dashboard:
  // 'inventory' | 'catalog' | 'new-product' | 'promotions'
  const [activeTab, setActiveTab] = useState('inventory');

  // Database Product Search & Filter (for 'catalog' tab)
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDbProductForModal, setSelectedDbProductForModal] = useState(null);

  // Inline editing of existing seller listing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadSellerDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await api.get('/seller/status');
      const statusData = statusRes.data;
      setSellerStatus(statusData);

      if (statusData.isSeller && statusData.isVerified) {
        const [invRes, prodRes, catRes] = await Promise.all([
          api.get('/seller/getAllSellerInventory').catch(() => ({ data: { listings: [] } })),
          api.get('/products').catch(() => ({ data: { products: [] } })),
          api.get('/products/categories').catch(() => ({ data: { categories: [] } })),
        ]);
        setListings(invRes.data?.listings || []);
        setDbProducts(prodRes.data?.products || []);
        setCategories(catRes.data?.categories || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load seller status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellerDashboard();
  }, [loadSellerDashboard]);

  const fetchDatabaseProducts = async (searchOverride, categoryOverride) => {
    setCatalogLoading(true);
    try {
      const params = {};
      const q = searchOverride !== undefined ? searchOverride : productSearch;
      const cat = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      if (q.trim()) params.search = q.trim();
      if (cat) params.category = cat;
      const res = await api.get('/products', { params });
      setDbProducts(res.data?.products || []);
    } catch {
      toast.error('Failed to search database products');
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleDelete = async (listingId) => {
    try {
      await api.delete(`/seller/deleteListing/${listingId}`);
      toast.success('Listing marked inactive');
      loadSellerDashboard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove listing');
    }
  };

  const handleUpdate = async (listingId) => {
    try {
      const data = {};
      if (editForm.quantity !== undefined) data.quantity = Number(editForm.quantity);
      if (editForm.price !== undefined) data.price = Number(editForm.price);
      if (editForm.condition) data.condition = editForm.condition;
      await api.put(`/seller/updateListing/${listingId}`, data);
      toast.success('Listing updated!');
      setEditingId(null);
      loadSellerDashboard();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update listing');
    }
  };

  if (loading) return <LoadingSpinner text="Loading seller panel..." />;

  // 1. User is NOT a seller yet -> Show Seller Application Form
  if (!sellerStatus?.isSeller) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <SellerSignup
          user={user}
          onSuccess={async () => {
            await fetchProfile();
            await loadSellerDashboard();
          }}
        />
      </div>
    );
  }

  // 2. User IS a seller, but NOT verified by Admin yet -> Show Pending Verification Screen
  if (!sellerStatus?.isVerified) {
    const seller = sellerStatus.seller;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
        <Card className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="text-amber-500" size={32} />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Clock size={12} /> Seller Request Pending Admin Approval
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Store: {seller?.storeName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
              Your seller registration request (Seller ID #{seller?.id}) has been received, but an administrator has <strong>not verified your seller account yet</strong>. Once an admin approves your seller request, you will unlock full access to list database products, create new catalog products, and manage promotions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Registered Store Name:</span>
              <span className="font-bold text-gray-900 dark:text-white">{seller?.storeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Seller Account Status:</span>
              <Badge color="blue">Registered Seller</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Admin Verification:</span>
              <Badge color="yellow">Pending Admin Approval</Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={async () => {
                await fetchProfile();
                await loadSellerDashboard();
              }}
            >
              <RefreshCw size={16} /> Check Verification Status
            </Button>
            <Link to="/profile">
              <Button variant="secondary">View in Personal Info</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Verified Seller Dashboard
  const seller = sellerStatus.seller;

  // Map productId -> array of active conditions this seller already has listed
  const sellerConditionsByProduct = {};
  for (const l of listings) {
    if (l.isActive && l.product?.id) {
      if (!sellerConditionsByProduct[l.product.id]) {
        sellerConditionsByProduct[l.product.id] = [];
      }
      sellerConditionsByProduct[l.product.id].push(l.condition);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      {/* Verified Store Header */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50/70 via-white to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Store size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {seller?.storeName}
                </h1>
                <Badge color="green">
                  <CheckCircle2 size={12} className="mr-1" /> Verified by Admin
                </Badge>
                {seller?.trusted ? (
                  <Badge color="indigo">
                    <Crown size={12} className="mr-1" /> Trusted Seller
                  </Badge>
                ) : (
                  <Badge color="gray">Standard Seller</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Seller ID #{seller?.id} · Manage your store inventory, choose from database products, or register new products into the catalog.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('catalog')}
            >
              <Layers size={15} /> Choose from Database Products
            </Button>
            <Button
              size="sm"
              onClick={() => setActiveTab('new-product')}
            >
              <Plus size={15} /> Add New Product to DB
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-2 bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner">
        {[
          {
            id: 'inventory',
            label: `My Store Inventory (${listings.length})`,
            icon: Package,
          },
          {
            id: 'catalog',
            label: `Database Products (${dbProducts.length})`,
            icon: Layers,
          },
          {
            id: 'new-product',
            label: 'Add New Product to DB',
            icon: Plus,
          },
          {
            id: 'promotions',
            label: 'Promotions & Discounts',
            icon: Megaphone,
          },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Modal when seller chooses an existing product from Database Products */}
      {selectedDbProductForModal && (
        <SelectExistingProductModal
          product={selectedDbProductForModal}
          existingConditions={sellerConditionsByProduct[selectedDbProductForModal.id] || []}
          onClose={() => setSelectedDbProductForModal(null)}
          onSuccess={() => {
            loadSellerDashboard();
            setActiveTab('inventory');
          }}
        />
      )}

      {/* TAB 1: MY STORE INVENTORY */}
      {activeTab === 'inventory' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="text-indigo-500" size={20} /> My Store Listings ({listings.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Your store&apos;s inventory offers (`SellerInventory`). Edit stock, price, or condition at any time.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setActiveTab('catalog')}>
                <Layers size={14} /> Add from Database Products
              </Button>
              <Button size="sm" onClick={() => setActiveTab('new-product')}>
                <Plus size={14} /> Create New Product
              </Button>
            </div>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No store listings yet"
              description="Choose an existing product from the database catalog to list it in your store, or register a brand new product if it is not in the database yet."
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button size="sm" onClick={() => setActiveTab('catalog')}>
                    <Layers size={15} /> Browse Database Products
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setActiveTab('new-product')}>
                    <Plus size={15} /> Add New Product to DB
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => {
                const currentListingId = listing.id;
                const warranty = listing.productWaranty;
                const hasWarranty =
                  warranty && typeof warranty === 'object' && (warranty.corp || warranty.time);

                return (
                  <div
                    key={currentListingId}
                    className="p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/70 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {listing.product?.images?.[0] ? (
                            <img
                              src={listing.product.images[0]}
                              alt={listing.product?.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={24} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/products/${listing.product?.id}`}
                              className="font-bold text-gray-900 dark:text-white capitalize hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              {listing.product?.productName}
                            </Link>
                            <Badge color="gray">Listing #{currentListingId}</Badge>
                            <Badge
                              color={
                                listing.condition === 'NEW'
                                  ? 'green'
                                  : listing.condition === 'BARELY_USED'
                                  ? 'blue'
                                  : 'yellow'
                              }
                            >
                              {listing.condition?.replace('_', ' ')}
                            </Badge>
                            <Badge color={listing.isActive ? 'green' : 'red'}>
                              {listing.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {listing.product?.brand && (
                              <span className="uppercase font-semibold">
                                {listing.product.brand} · {listing.product.model} ·{' '}
                              </span>
                            )}
                            Price: <strong>${listing.price?.toLocaleString()}</strong>
                            {listing.discountedPrice > 0 &&
                              listing.discountedPrice < listing.price && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                                  (Promo: ${listing.discountedPrice.toLocaleString()})
                                </span>
                              )}{' '}
                            · Stock: <strong>{listing.quantity} units</strong>
                            {hasWarranty && (
                              <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                                · Warranty: {warranty.corp} (until{' '}
                                {new Date(warranty.time).toLocaleDateString()})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(editingId === currentListingId ? null : currentListingId);
                            setEditForm({
                              quantity: listing.quantity,
                              price: listing.price,
                              condition: listing.condition,
                            });
                          }}
                        >
                          <Edit3 size={14} /> Edit
                        </Button>
                        {listing.isActive && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(currentListingId)}
                          >
                            <Trash2 size={14} /> Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingId === currentListingId && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 grid sm:grid-cols-4 gap-3 items-end animate-fade-in">
                        <Input
                          label="Quantity"
                          type="number"
                          min="0"
                          value={editForm.quantity}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, quantity: e.target.value }))
                          }
                        />
                        <Input
                          label="Price ($)"
                          type="number"
                          min="1"
                          value={editForm.price}
                          onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                        />
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Condition
                          </label>
                          <select
                            value={editForm.condition}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, condition: e.target.value }))
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="NEW">NEW</option>
                            <option value="BARELY_USED">BARELY USED</option>
                            <option value="USED">USED</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(currentListingId)}>
                            <Save size={14} /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: BROWSE ALL DATABASE PRODUCTS (DISTINCT FROM LISTINGS) */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="text-indigo-500" size={20} /> Available Products in Database ({dbProducts.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Select any existing product from the central database catalog to add it to your store&apos;s listings. If the product you want is not in the database, click <strong>Add New Product to DB</strong>.
                </p>
              </div>
              <Button onClick={() => setActiveTab('new-product')} size="sm">
                <Plus size={15} /> Product Not in DB? Add New Product
              </Button>
            </div>

            {/* Search & Category Filter for Database Products */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchDatabaseProducts(productSearch, selectedCategory);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search database products by name, brand, or model..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search DB
              </Button>
              {(productSearch || selectedCategory) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setProductSearch('');
                    setSelectedCategory('');
                    fetchDatabaseProducts('', '');
                  }}
                >
                  Reset
                </Button>
              )}
            </form>

            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                  <Filter size={12} /> Category:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    fetchDatabaseProducts(productSearch, '');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${
                    selectedCategory === ''
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id || cat.categoryName}
                    onClick={() => {
                      const next =
                        selectedCategory === cat.categoryName ? '' : cat.categoryName;
                      setSelectedCategory(next);
                      fetchDatabaseProducts(productSearch, next);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize border cursor-pointer ${
                      selectedCategory === cat.categoryName
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {catalogLoading ? (
            <LoadingSpinner text="Searching database products..." />
          ) : dbProducts.length === 0 ? (
            <Card className="p-10 text-center space-y-4">
              <Package size={40} className="mx-auto text-gray-400" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Product Not Found in Database
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  No existing product in the database matched your search. You can register this product into the database and create your store listing right now.
                </p>
              </div>
              <Button onClick={() => setActiveTab('new-product')}>
                <Plus size={16} /> Add New Product to Database & Listing
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {dbProducts.map((prod) => {
                const myConditions = sellerConditionsByProduct[prod.id] || [];
                return (
                  <Card
                    key={prod.id}
                    className="p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {prod.images?.[0] ? (
                            <img
                              src={prod.images[0]}
                              alt={prod.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={24} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase font-semibold">
                            <span>
                              {prod.brand} · {prod.model}
                            </span>
                            <span>DB #{prod.id}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white capitalize truncate mt-0.5">
                            {prod.productName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                              <Star size={12} className="fill-amber-400" />
                              {prod.rating > 0 ? `${Number(prod.rating).toFixed(1)}/100` : 'Unrated'}
                            </span>
                            <span className="text-xs text-gray-400">
                              · {prod.listings?.length || 0} total seller offer
                              {(prod.listings?.length || 0) === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {prod.description}
                      </p>

                      {prod.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {prod.categories.map((c, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 capitalize font-medium"
                            >
                              {c.categoryName}
                            </span>
                          ))}
                        </div>
                      )}

                      {myConditions.length > 0 && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                          ✓ In your listings ({myConditions.join(', ')})
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedDbProductForModal(prod)}
                      >
                        <Plus size={14} /> Add to My Listings
                      </Button>
                      <Link to={`/products/${prod.id}`}>
                        <Button size="sm" variant="secondary">
                          <ExternalLink size={14} />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADD NEW PRODUCT TO DB & CREATE LISTING */}
      {activeTab === 'new-product' && (
        <CreateNewProductAndListingForm
          categories={categories}
          onBackToCatalog={() => setActiveTab('catalog')}
          onSuccess={() => {
            loadSellerDashboard();
            setActiveTab('inventory');
          }}
        />
      )}

      {/* TAB 4: PROMOTIONS */}
      {activeTab === 'promotions' && <PromotionsPanel listings={listings} />}
    </div>
  );
}
