import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { Button, Input, Card } from '../components/ui/Shared.jsx';
import { CreditCard, MapPin, Package, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ address: '', postalCode: '' });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/users/readAddress')
      .then((res) => {
        const list = res.data.address || [];
        setSavedAddresses(list);
        if (list.length > 0) {
          setForm({ address: list[0].address, postalCode: list[0].postalCode });
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
  };

  const handleSelectAddress = (addr) => {
    setForm({ address: addr.address, postalCode: addr.postalCode });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await api.post('/orders/createOrder', form);
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      const data = err.response?.data;
      if (data?.details) {
        const fieldErrors = {};
        data.details.forEach((d) => { fieldErrors[d.field] = d.message; });
        setErrors(fieldErrors);
      } else {
        toast.error(data?.error || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-slide-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-500/25">
          <CreditCard size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Confirm your delivery details</p>
      </div>

      {savedAddresses.length > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-indigo-500" /> Use Saved Address
          </h2>
          <div className="space-y-2">
            {savedAddresses.map((addr, i) => {
              const selected = form.address === addr.address && form.postalCode === addr.postalCode;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleSelectAddress(addr)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                    selected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{addr.address}</p>
                    <p className="text-gray-500 dark:text-gray-400">Postal: {addr.postalCode}</p>
                  </div>
                  {selected && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Shipping Address (5-200 characters)"
            name="address"
            value={form.address}
            onChange={handleChange}
            error={errors.address}
            placeholder="Enter your street and city address"
            required
          />
          <Input
            label="Postal Code"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            error={errors.postalCode}
            placeholder="e.g. 12345"
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            <Package size={16} /> Place Order
          </Button>
        </form>
      </Card>
    </div>
  );
}
