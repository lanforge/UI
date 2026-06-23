import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const TYPE_OPTIONS = ['tshirt', 'hoodie', 'hat', 'mug', 'sticker', 'poster', 'bag', 'socks', 'pin', 'other'];

interface MerchForm {
  type: string;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  stock: string;
  reorderPoint: string;
  sizes: string;
  colors: string;
  material: string;
  images: string;
  tags: string;
  description: string;
  weight: string;
  isActive: boolean;
  isFeatured: boolean;
}

const emptyForm: MerchForm = {
  type: 'tshirt',
  name: '',
  slug: '',
  brand: 'LANForge',
  sku: '',
  price: '',
  compareAtPrice: '',
  cost: '',
  stock: '0',
  reorderPoint: '5',
  sizes: '',
  colors: '',
  material: '',
  images: '',
  tags: '',
  description: '',
  weight: '0',
  isActive: true,
  isFeatured: false,
};

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminAddMerchPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<MerchForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setIsLoading(true);
    api.get(`/merch/${id}`)
      .then(res => {
        const m = res.data.merch;
        setForm({
          type: m.type,
          name: m.name,
          slug: m.slug,
          brand: m.brand || 'LANForge',
          sku: m.sku,
          price: String(m.price),
          compareAtPrice: m.compareAtPrice != null ? String(m.compareAtPrice) : '',
          cost: m.cost != null ? String(m.cost) : '',
          stock: String(m.stock ?? 0),
          reorderPoint: String(m.reorderPoint ?? 5),
          sizes: (m.sizes || []).join(', '),
          colors: (m.colors || []).join(', '),
          material: m.material || '',
          images: (m.images || []).join('\n'),
          tags: (m.tags || []).join(', '),
          description: m.description || '',
          weight: String(m.weight ?? 0),
          isActive: m.isActive,
          isFeatured: m.isFeatured,
        });
      })
      .catch(err => {
        console.error('Failed to load merch', err);
        setError('Failed to load merch item');
      })
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  const update = <K extends keyof MerchForm>(field: K, value: MerchForm[K]) => {
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
      type: form.type,
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      brand: form.brand.trim() || 'LANForge',
      sku: form.sku.trim().toUpperCase(),
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock, 10) || 0,
      reorderPoint: parseInt(form.reorderPoint, 10) || 5,
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      material: form.material.trim() || undefined,
      images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      description: form.description,
      weight: parseFloat(form.weight) || 0,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };
    if (form.compareAtPrice) payload.compareAtPrice = parseFloat(form.compareAtPrice);

    try {
      if (isEdit) {
        await api.put(`/merch/${id}`, payload);
      } else {
        await api.post('/merch', payload);
      }
      navigate('/admin/merch');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Failed to save merch';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-500 text-sm">Loading merch...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">{isEdit ? 'Edit Merch' : 'Add Merch'}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isEdit ? 'Update an existing merch item' : 'Create a new apparel or swag item'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/merch')}
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
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Type *</label>
              <select
                className="admin-input"
                value={form.type}
                onChange={e => update('type', e.target.value)}
                required
              >
                {TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Brand</label>
              <input
                type="text"
                className="admin-input"
                value={form.brand}
                onChange={e => update('brand', e.target.value)}
              />
            </div>
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
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">SKU *</label>
              <input
                type="text"
                className="admin-input"
                value={form.sku}
                onChange={e => update('sku', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Material</label>
              <input
                type="text"
                className="admin-input"
                value={form.material}
                onChange={e => update('material', e.target.value)}
                placeholder="e.g. 100% cotton"
              />
            </div>
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
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Pricing & Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Stock</label>
              <input
                type="number"
                min="0"
                className="admin-input"
                value={form.stock}
                onChange={e => update('stock', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Reorder Point</label>
              <input
                type="number"
                min="0"
                className="admin-input"
                value={form.reorderPoint}
                onChange={e => update('reorderPoint', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Weight (lb)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="admin-input"
                value={form.weight}
                onChange={e => update('weight', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Sizes (comma separated)</label>
              <input
                type="text"
                className="admin-input"
                value={form.sizes}
                onChange={e => update('sizes', e.target.value)}
                placeholder="S, M, L, XL"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Colors (comma separated)</label>
              <input
                type="text"
                className="admin-input"
                value={form.colors}
                onChange={e => update('colors', e.target.value)}
                placeholder="Black, White, Emerald"
              />
            </div>
          </div>
        </div>

        <div className="admin-card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Media & Tags</h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Images (one URL per line)</label>
            <textarea
              className="admin-input h-24"
              value={form.images}
              onChange={e => update('images', e.target.value)}
              placeholder="https://cdn.example.com/merch/front.jpg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Tags (comma separated)</label>
            <input
              type="text"
              className="admin-input"
              value={form.tags}
              onChange={e => update('tags', e.target.value)}
              placeholder="streetwear, esports, summer-drop"
            />
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
            onClick={() => navigate('/admin/merch')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors text-sm font-medium"
          >
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Merch'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddMerchPage;
