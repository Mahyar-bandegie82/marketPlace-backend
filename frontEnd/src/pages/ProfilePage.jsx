import { useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Card, Badge, LoadingSpinner } from '../components/ui/Shared.jsx';
import {
  User,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Save,
  ShieldCheck,
  Mail,
  Send,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const [editForm, setEditForm] = useState({ phoneNumber: '', changes: {} });
  const [editing, setEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // OTP Verification state
  const [otpMode, setOtpMode] = useState('signup'); // 'signup' | 'credentialChange'
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [newAddr, setNewAddr] = useState({ addressLine: '', postalCode: '' });
  const [addingAddr, setAddingAddr] = useState(false);
  const [editingAddrIndex, setEditingAddrIndex] = useState(null);
  const [editAddrForm, setEditAddrForm] = useState({ addressLine: '', postalCode: '' });

  const fetchAddresses = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setAddresses([]);
      setAddrLoading(false);
      return;
    }
    try {
      const res = await api.get('/users/readAddress');
      setAddresses(res.data.address || []);
    } catch {
      setAddresses([]);
    } finally {
      setAddrLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(editForm.changes).length === 0) {
      return toast.error('No changes to save');
    }
    setEditLoading(true);
    try {
      const res = await api.put('/auth/editinfo', editForm);
      toast.success(res.data.message);
      updateUser(res.data.newInfo);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpSending(true);
    try {
      const endpoint =
        otpMode === 'signup'
          ? '/auth/signup/reciveOtp'
          : '/auth/credentialChange/reciveOtp';
      const res = await api.get(endpoint);
      toast.success(res.data.message || 'OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      return toast.error('Please enter a 6-digit OTP code');
    }
    setOtpVerifying(true);
    try {
      const endpoint =
        otpMode === 'signup'
          ? '/auth/signup/verify-otp'
          : '/auth/credentialChange/verify-otp';
      const res = await api.post(endpoint, { otp: otpCode });
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      toast.success(res.data.message || 'Account verified successfully!');
      if (res.data.value) updateUser(res.data.value);
      setOtpCode('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddingAddr(true);
    try {
      await api.put('/users/addAddres', newAddr);
      toast.success('Address added');
      setNewAddr({ addressLine: '', postalCode: '' });
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add address');
    } finally {
      setAddingAddr(false);
    }
  };

  const handleSaveEditAddress = async (origAddr) => {
    try {
      await api.put('/users/editAddress', {
        address: { addressLine: origAddr.address, postalCode: origAddr.postalCode },
        changes: {
          addressLine: editAddrForm.addressLine || origAddr.address,
          postalCode: editAddrForm.postalCode || origAddr.postalCode,
        },
      });
      toast.success('Address updated successfully');
      setEditingAddrIndex(null);
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressLine, postalCode) => {
    try {
      await api.delete('/users/deleteAddress', { data: { addressLine, postalCode } });
      toast.success('Address deleted');
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (authLoading) return <LoadingSpinner text="Loading account information..." />;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="text-indigo-500" /> Personal & Account Info
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal credentials, email verification, and saved shipping addresses.
          </p>
        </div>

        <Card className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500">
                <User size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Guest Visitor</h2>
                  <Badge color="gray">No Active Token</Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  You can browse the entire marketplace and build your cart freely. Sign in or create an account to save shipping addresses and manage your personal credentials.
                </p>
              </div>
            </div>
            <div className="flex sm:flex-col gap-2.5 flex-shrink-0">
              <Link to="/login">
                <Button className="w-full">
                  <LogIn size={16} /> Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="secondary" className="w-full">
                  <UserPlus size={16} /> Create Account
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="p-6 space-y-2 opacity-80">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <ShieldCheck size={18} className="text-emerald-500" /> Email OTP Verification
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Verify your email with a 6-digit one-time code after signing up or updating your account credentials.
            </p>
          </Card>

          <Card className="p-6 space-y-2 opacity-80">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <MapPin size={18} className="text-indigo-500" /> Saved Shipping Addresses
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Store up to 3 delivery addresses and postal codes for instant one-click selection during order checkout.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      {/* Profile Header */}
      <Card className="p-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/25">
            {(user?.userName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.userName || 'User'}
              </h1>
              {user?.otpVerified ? (
                <Badge color="green">
                  <CheckCircle2 size={12} className="mr-1" /> Verified
                </Badge>
              ) : (
                <Badge color="yellow">Unverified</Badge>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user?.email || ''}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.phoneNumber || ''}</p>
          </div>
        </div>

        {!editing ? (
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setEditing(true);
              setEditForm({ phoneNumber: user?.phoneNumber || '', changes: {} });
            }}
          >
            <Edit3 size={16} /> Edit Profile & Credentials
          </Button>
        ) : (
          <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
            <Input
              label="Current Phone (required to verify changes)"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              placeholder="09181234567"
            />
            <Input
              label="New Username"
              value={editForm.changes.userName || ''}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  changes: { ...f.changes, userName: e.target.value || undefined },
                }))
              }
              placeholder="New username"
            />
            <Input
              label="New Email"
              type="email"
              value={editForm.changes.email || ''}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  changes: { ...f.changes, email: e.target.value || undefined },
                }))
              }
              placeholder="new@email.com"
            />
            <Input
              label="New Password"
              type="password"
              value={editForm.changes.password || ''}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  changes: { ...f.changes, password: e.target.value || undefined },
                }))
              }
              placeholder="New password (9-72 chars, 2 upper, 2 digits, 1 special)"
            />
            <div className="flex gap-3">
              <Button type="submit" loading={editLoading}>
                <Save size={16} /> Save Changes
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* OTP Email Verification Section */}
      <Card className="p-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <ShieldCheck className="text-emerald-500" size={20} /> Email Verification (OTP)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Request a 6-digit one-time password sent to your registered email to verify your account or confirm credential changes.
        </p>

        <div className="flex gap-2 mb-4">
          <Button
            variant={otpMode === 'signup' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setOtpMode('signup')}
          >
            Signup Verification
          </Button>
          <Button
            variant={otpMode === 'credentialChange' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setOtpMode('credentialChange')}
          >
            Credential Change Verification
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="secondary" onClick={handleSendOtp} loading={otpSending}>
              <Mail size={16} /> Send OTP Code
            </Button>
          </div>

          <form onSubmit={handleVerifyOtp} className="flex gap-3 max-w-md items-end">
            <div className="flex-1">
              <Input
                label="6-Digit Code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <Button type="submit" loading={otpVerifying}>
              <Send size={16} /> Verify
            </Button>
          </form>
        </div>
      </Card>

      {/* Addresses */}
      <Card className="p-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <MapPin className="text-indigo-500" size={20} /> Shipping Addresses
        </h2>

        {addresses.length === 0 && !addrLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No saved addresses yet.</p>
        )}

        <div className="space-y-3 mb-6">
          {addresses.map((addr, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{addr.address}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Postal: {addr.postalCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (editingAddrIndex === i) {
                        setEditingAddrIndex(null);
                      } else {
                        setEditingAddrIndex(i);
                        setEditAddrForm({
                          addressLine: addr.address,
                          postalCode: addr.postalCode,
                        });
                      }
                    }}
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAddress(addr.address, addr.postalCode)}
                    className="text-red-500"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {editingAddrIndex === i && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3 animate-fade-in">
                  <Input
                    label="Edit Address Line (10-80 chars)"
                    value={editAddrForm.addressLine}
                    onChange={(e) =>
                      setEditAddrForm((f) => ({ ...f, addressLine: e.target.value }))
                    }
                  />
                  <Input
                    label="Edit Postal Code"
                    value={editAddrForm.postalCode}
                    onChange={(e) =>
                      setEditAddrForm((f) => ({ ...f, postalCode: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEditAddress(addr)}>
                      <Save size={14} /> Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingAddrIndex(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleAddAddress}
          className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Add New Address (Max 3)
          </h3>
          <Input
            label="Address"
            value={newAddr.addressLine}
            onChange={(e) => setNewAddr((f) => ({ ...f, addressLine: e.target.value }))}
            placeholder="Enter full address (min 10 chars)"
          />
          <Input
            label="Postal Code"
            value={newAddr.postalCode}
            onChange={(e) => setNewAddr((f) => ({ ...f, postalCode: e.target.value }))}
            placeholder="Postal code"
          />
          <Button type="submit" variant="secondary" loading={addingAddr}>
            <Plus size={16} /> Add Address
          </Button>
        </form>
      </Card>
    </div>
  );
}
