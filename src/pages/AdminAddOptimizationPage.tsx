import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const CATEGORY_OPTIONS = ['tuning', 'cooling', 'aesthetics', 'software', 'hardware', 'performance', 'support', 'other'];

interface OptimizationForm {
  name: string;
  slug: string;
  category: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  estimatedHours: string;
  sortOrder: string;
  icon: string;
  image: string;
  shortDescription: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
}

const emptyForm: OptimizationForm = {
  name: '',
  slug: '',
  category: 'performance',
  price: '',
  compareAtPrice: '',
  cost: '',
  estimatedHours: '',
  sortOrder: '0',
  icon: '',
  image: '',
  shortDescription: '',
  description: '',
  isActive: true,
  isFeatured: false,
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminAddOptimizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<OptimizationForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setIsLoading(true);
    api.get(`/optimizations/${id}`)
      .then(res => {
        const o = res.data.optimization;
        setForm({
          name: o.name,
          slug: o.slug,
          category: o.category,
          price: String(o.price),
          compareAtPrice: o.compareAtPrice != null ? String(o.compareAtPrice) : '',
          cost: o.cost != null ? String(o.cost) : '',
          estimatedHours: o.estimatedHours != null ? String(o.estimatedHours) : '',
          sortOrder: String(o.sortOrder ?? 0),
          icon: o.icon || '',
          image: o.image || '',
          shortDescription: o.shortDescription || '',
          description: o.description || '',
          isActive: o.isActive,
          isFeatured: o.isFeatured,
        });
      })
      .catch(err => {
        console.error('Failed to load optimization', err);
        setError('Failed to load optimization');
      })
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  const update = <K extends keyof OptimizationForm>(field: K, value: OptimizationForm[K]) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !isEdit && !prev.slug) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    const payload: any = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      category: form.category,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      icon: form.icon.trim() || undefined,
      image: form.image.trim() || undefined,
      shortDescription: form.shortDescription.trim() || undefined,
      description: form.description,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };
    if (form.compareAtPrice) payload.compareAtPrice = parseFloat(form.compareAtPrice);
    if (form.estimatedHours) payload.estimatedHours = parseFloat(form.estimatedHours);

    try {
      if (isEdit) {
        await api.put(`/optimizations/${id}`, payload);
      } else {
        await api.post('/optimizations', payload);
      }
      navigate('/admin/optimizations');
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Failed to save optimization';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-500 text-sm">Loading optimization...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">{isEdit ? 'Edit Optimization' : 'Add Optimization'}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isEdit ? 'Update an existing PC add-on service' : 'Create a new PC add-on service (sold only with a PC)'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/optimizations')}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="admin-card p-4 border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Basics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Name *</label>
              <input
                type="text"
                className="admin-input"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Slug</label>
              <input
                type="text"
                className="admin-input"
                value={form.slug}
                onChange={e => update('slug', e.target.value)}
                placeholder="auto-generated from name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Category *</label>
              <select
                className="admin-input"
                value={form.category}
                onChange={e => update('category', e.target.value)}
                required
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Sort Order</label>
              <input
                type="number"
                className="admin-input"
                value={form.sortOrder}
                onChange={e => update('sortOrder', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Short Description</label>
            <input
              type="text"
              className="admin-input"
              value={form.shortDescription}
              onChange={e => update('shortDescription', e.target.value)}
              placeholder="One-line summary shown in cart upsell"
              maxLength={140}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Description *</label>
            <textarea
              className="admin-input h-32"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                value={form.price}
                onChange={e => update('price', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Compare-at Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                value={form.compareAtPrice}
                onChange={e => update('compareAtPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Cost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                value={form.cost}
                onChange={e => update('cost', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Est. Hours</label>
              <input
                type="number"
                step="0.25"
                min="0"
                className="admin-input"
                value={form.estimatedHours}
                onChange={e => update('estimatedHours', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Icon (URL or font-awesome name)</label>
              <input
                type="text"
                className="admin-input"
                value={form.icon}
                onChange={e => update('icon', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Image URL</label>
              <input
                type="text"
                className="admin-input"
                value={form.image}
                onChange={e => update('image', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-card p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Visibility</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => update('isActive', e.target.checked)}
              />
              Active (visible to shoppers)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={e => update('isFeatured', e.target.checked)}
              />
              Featured
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/optimizations')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors text-sm font-medium"
          >
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Optimization'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddOptimizationPage;
