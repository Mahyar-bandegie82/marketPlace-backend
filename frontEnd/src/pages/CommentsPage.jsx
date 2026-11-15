import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Card, LoadingSpinner, EmptyState } from '../components/ui/Shared.jsx';
import { MessageSquare, Plus, Trash2, Edit3, Star, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function CommentsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ productId: '', rating: '', massage: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchComments = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setComments([]);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/comments/getComments');
      setComments(res.data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleToggleCreate = () => {
    if (!user) {
      toast.error('Please sign in to submit a product review');
      return navigate('/login', { state: { from: '/comments' } });
    }
    setShowCreate(!showCreate);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post('/comments/createComment', {
        productId: Number(createForm.productId),
        rating: Number(createForm.rating),
        massage: createForm.massage,
      });
      toast.success('Review added!');
      setShowCreate(false);
      setCreateForm({ productId: '', rating: '', massage: '' });
      fetchComments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create review');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await api.delete(`/comments/deleteComment/${productId}`);
      toast.success('Review deleted');
      fetchComments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleUpdate = async (productId) => {
    try {
      const data = {};
      if (editForm.rating) data.rating = Number(editForm.rating);
      if (editForm.massage) data.massage = editForm.massage;
      await api.patch(`/comments/updateComment/${productId}`, data);
      toast.success('Review updated');
      setEditingId(null);
      fetchComments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  if (authLoading || loading) return <LoadingSpinner text="Loading reviews..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MessageSquare className="text-indigo-500" /> My Reviews
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your product ratings and feedback.
          </p>
        </div>
        <Button onClick={handleToggleCreate} variant="secondary" size="sm">
          <Plus size={14} /> Write Review
        </Button>
      </div>

      {showCreate && (
        <Card className="p-6 mb-6 animate-fade-in">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Product ID"
              type="number"
              value={createForm.productId}
              onChange={(e) => setCreateForm((f) => ({ ...f, productId: e.target.value }))}
              placeholder="Product ID to review"
            />
            <Input
              label="Rating (1-100)"
              type="number"
              value={createForm.rating}
              onChange={(e) => setCreateForm((f) => ({ ...f, rating: e.target.value }))}
              placeholder="e.g. 85"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Review
              </label>
              <textarea
                value={createForm.massage}
                onChange={(e) => setCreateForm((f) => ({ ...f, massage: e.target.value }))}
                rows={3}
                placeholder="Write your review..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={createLoading} size="sm">
                <Save size={14} /> Submit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description={
            user
              ? 'Write your first review on a product you have purchased.'
              : 'Sign in when you are ready to post or manage your product reviews.'
          }
        />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {comment.product?.productName || `Product #${comment.productId}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.rating}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">/ 100</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(editingId === comment.id ? null : comment.id);
                      setEditForm({ rating: comment.rating, massage: comment.massage });
                    }}
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.productId)}
                    className="text-red-500"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{comment.massage}</p>

              {editingId === comment.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 animate-fade-in">
                  <Input
                    label="Rating"
                    type="number"
                    value={editForm.rating}
                    onChange={(e) => setEditForm((f) => ({ ...f, rating: e.target.value }))}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Review
                    </label>
                    <textarea
                      value={editForm.massage}
                      onChange={(e) => setEditForm((f) => ({ ...f, massage: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <Button size="sm" onClick={() => handleUpdate(comment.productId)}>
                    <Save size={14} /> Save
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
