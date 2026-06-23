import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import CDNImagePicker from '../components/CDNImagePicker';

interface PCPart {
  _id: string;
  partModel: string;
  type: string;
  brand: string;
  cost: number;
  price?: number;
}

const AdminAddProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [availableParts, setAvailableParts] = useState<PCPart[]>([]);
  const [selectedCoreParts, setSelectedCoreParts] = useState<Record<string, string>>({
    cpu: '',
    gpu: '',
    motherboard: '',
    ram: '',
    storage: '',
    psu: '',
    case: '',
    'cpu-cooler': '',
    os: ''
  });
  const [selectedFans, setSelectedFans] = useState<string[]>([]);
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [showCdnPicker, setShowCdnPicker] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    category: 'Gaming PCs',
    price: '',
    compareAtPrice: '',
    cost: '',
    stock: '0',
    description: '',
    shortDescription: '',
    tags: '',
    isActive: true,
    reorderPoint: '5',
    reorderQty: '10',
    images: [] as string[]
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const partsRes = await api.get('/pc-parts/admin/all', { params: { limit: 1000 } });
        setAvailableParts(partsRes.data.parts || []);
        
        if (isEditing && id) {
          const productRes = await api.get(`/products/admin/${id}`);
          const p = productRes.data.product;
          
          setFormData({
            name: p.name || '',
            slug: p.slug || '',
            sku: p.sku || '',
            category: p.category || 'Gaming PCs',
            price: p.price ? p.price.toString() : '0',
            compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : '',
            cost: p.cost ? p.cost.toString() : '0',
            stock: p.stock ? p.stock.toString() : '0',
            description: p.description || '',
            shortDescription: p.shortDescription || '',
            tags: (p.tags && p.tags[0]) ? p.tags[0] : '',
            isActive: p.isActive !== false,
            reorderPoint: p.reorderPoint ? p.reorderPoint.toString() : '5',
            reorderQty: p.reorderQty ? p.reorderQty.toString() : '10',
            images: p.images || []
          });
          
          const coreMap: Record<string, string> = {
            cpu: '', gpu: '', motherboard: '', ram: '', storage: '', psu: '', case: '', 'cpu-cooler': '', os: ''
          };
          const fans: string[] = [];
          
          if (p.parts) {
            p.parts.forEach((partObj: any) => {
              const part = partObj._id || partObj; // handle populated or unpopulated
              const matchedPart = partsRes.data.parts.find((ap: any) => ap._id === part);
              if (matchedPart) {
                if (matchedPart.type === 'fan') {
                  fans.push(part);
                } else if (coreMap[matchedPart.type] !== undefined) {
                  coreMap[matchedPart.type] = part;
                }
              }
            });
          }
          setSelectedCoreParts(coreMap);
          setSelectedFans(fans);

          // Need to manually calculate initial cost since state updates are asynchronous
          const allIds = [...Object.values(coreMap).filter(Boolean), ...fans];
          const newCost = allIds.reduce((sum, partId) => {
            const part = partsRes.data.parts.find((ap: any) => ap._id === partId);
            return sum + (part?.cost || part?.price || 0);
          }, 0);
          setCalculatedCost(newCost);
        }
      } catch (err) {
        console.error('Failed to load data', err);
        setError('Failed to load initial data.');
      }
    };
    loadData();
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadData = new FormData();
    Array.from(e.target.files).forEach(f => uploadData.append('images', f));

    let folder = 'PCs/series';
    if (formData.tags === 'LANForge Mini Series') folder = 'PCs/mini-series';
    else if (formData.tags === 'Pre Configured') folder = 'PCs/pre-config';
    uploadData.append('folder', folder);

    try {
      const res = await api.post('/uploads/images', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...res.data.urls]
      }));
    } catch (err) {
      console.error('Image upload failed', err);
      alert('Failed to upload image(s).');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const selected = newImages.splice(index, 1)[0];
      newImages.unshift(selected); // Move to front
      return { ...prev, images: newImages };
    });
  };

  const generateSlug = () => {
    if (!formData.name) return;
    const newSlug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData(prev => ({ ...prev, slug: newSlug }));
  };

  const handleCorePartSelect = (category: string, partId: string) => {
    const updated = { ...selectedCoreParts, [category]: partId };
    setSelectedCoreParts(updated);
    recalculateCost(updated, selectedFans);
  };

  const toggleFan = (partId: string) => {
    const updatedFans = selectedFans.includes(partId)
      ? selectedFans.filter(id => id !== partId)
      : [...selectedFans, partId];
    
    setSelectedFans(updatedFans);
    recalculateCost(selectedCoreParts, updatedFans);
  };

  const recalculateCost = (coreParts: Record<string, string>, fans: string[]) => {
    const allIds = [...Object.values(coreParts).filter(Boolean), ...fans];
    const newCost = allIds.reduce((sum, id) => {
      const part = availableParts.find(p => p._id === id);
      return sum + (part?.cost || part?.price || 0);
    }, 0);

    setCalculatedCost(newCost);
    
    const rawMarkup = newCost * 1.20;
    const suggestedPrice = (Math.round(rawMarkup / 50) * 50 - 0.01).toFixed(2);
    setFormData(prev => ({
      ...prev,
      cost: newCost.toFixed(2),
      price: prev.price === '' || parseFloat(prev.price) === 0 ? suggestedPrice : prev.price
    }));
  };

  const applyMarkup = () => {
    const rawMarkup = calculatedCost * 1.20;
    const roundedPrice = (Math.round(rawMarkup / 50) * 50 - 0.01).toFixed(2);
    setFormData(prev => ({
      ...prev,
      price: roundedPrice
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        reorderPoint: parseInt(formData.reorderPoint, 10) || 0,
        reorderQty: parseInt(formData.reorderQty, 10) || 0,
        description: formData.description || 'No description provided.',
        tags: formData.tags ? [formData.tags] : [],
        parts: [...Object.values(selectedCoreParts).filter(Boolean), ...selectedFans],
        images: formData.images
      };

      if (isEditing && id) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/admin/products');
    } catch (err: any) {
      console.error('Failed to save product', err);
      setError(err.response?.data?.message || 'Failed to save product. Check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button 
            onClick={() => navigate('/admin/products')}
            className="text-slate-400 hover:text-white flex items-center space-x-2 text-sm mb-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Products</span>
          </button>
          <h1 className="text-xl font-medium text-white">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Parts Selection */}
        <div className="admin-card p-6 space-y-6">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-2">Included Parts</h2>
          <p className="text-sm text-slate-400">Select one component for each core category, and as many fans as needed. Cost is auto-calculated.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'cpu', label: 'CPU' },
              { id: 'gpu', label: 'GPU' },
              { id: 'motherboard', label: 'Motherboard' },
              { id: 'ram', label: 'RAM' },
              { id: 'storage', label: 'Storage' },
              { id: 'cpu-cooler', label: 'CPU Cooler' },
              { id: 'psu', label: 'Power Supply' },
              { id: 'case', label: 'Case' },
              { id: 'os', label: 'Operating System' },
            ].map(category => (
              <div key={category.id}>
                <label className="block text-sm font-medium text-slate-400 mb-2">{category.label}</label>
                <select
                  className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                  value={selectedCoreParts[category.id]}
                  onChange={e => handleCorePartSelect(category.id, e.target.value)}
                >
                  <option value="">-- None --</option>
                  {availableParts.filter(p => p.type === category.id).map(part => (
                    <option key={part._id} value={part._id}>
                      {part.brand} {part.partModel} (${(part.cost || part.price || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1f2233] pt-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">Case Fans (Select Multiple)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-[#0a0c13] rounded-xl border border-[#1f2233]">
              {availableParts.filter(p => p.type === 'fan').map(part => (
                <label key={part._id} className="flex items-center space-x-3 p-2 hover:bg-[#11141d] rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded bg-[#11141d] border-[#1f2233] text-emerald-500 focus:ring-emerald-500/20"
                    checked={selectedFans.includes(part._id)}
                    onChange={() => toggleFan(part._id)}
                  />
                  <div className="flex-1 truncate">
                    <span className="text-white text-sm font-medium truncate block">{part.brand} {part.partModel}</span>
                  </div>
                  <span className="text-slate-400 text-xs">${(part.cost || part.price || 0).toFixed(2)}</span>
                </label>
              ))}
              {availableParts.filter(p => p.type === 'fan').length === 0 && (
                <div className="text-slate-500 text-sm p-2 col-span-2">No fans available in inventory.</div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#11141d] p-4 rounded-xl border border-[#1f2233] mt-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Internal Parts Cost</p>
              <p className="text-xl font-medium text-white">${calculatedCost.toFixed(2)}</p>
            </div>
            <button 
              type="button" 
              onClick={applyMarkup}
              className="text-sm px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/30 font-medium"
            >
              Apply 20% Markup
            </button>
          </div>
        </div>

        {/* General Details */}
        <div className="admin-card p-6 space-y-6">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-2">Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.name}
                onChange={handleChange}
                onBlur={generateSlug}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Slug *</label>
              <input
                type="text"
                name="slug"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.slug}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">SKU *</label>
              <input
                type="text"
                name="sku"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl uppercase"
                value={formData.sku}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Category *</label>
              <select
                name="category"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Gaming PCs">Gaming PCs</option>
                <option value="Workstations">Workstations</option>
                <option value="Laptops">Laptops</option>
                <option value="Accessories">Accessories</option>
                <option value="Monitors">Monitors</option>
                <option value="DIY Kits">DIY Kits</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Retail Price ($) *</label>
              <input
                type="number"
                name="price"
                step="0.01"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl font-medium text-emerald-400"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Compare at Price ($)</label>
              <input
                type="number"
                name="compareAtPrice"
                step="0.01"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl font-medium text-slate-400"
                value={formData.compareAtPrice}
                onChange={handleChange}
                placeholder="Optional slash-through price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Total Cost ($)</label>
              <input
                type="number"
                name="cost"
                step="0.01"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-slate-400"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Initial Stock *</label>
              <input
                type="number"
                name="stock"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.stock}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Product Tag</label>
              <select
                name="tags"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.tags}
                onChange={handleChange}
              >
                <option value="">-- No Tag --</option>
                <option value="LANForge Series">LANForge Series</option>
                <option value="LANForge Mini Series">LANForge Mini Series</option>
                <option value="Pre Configured">Pre Configured</option>
                <option value="dignitas">Dignitas</option>
                <option value="tradeify">Tradeify</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Short Description</label>
              <input
                type="text"
                name="shortDescription"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.shortDescription}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Full Description</label>
              <textarea
                name="description"
                rows={4}
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Product Images</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className={`relative rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-emerald-500' : 'border-[#1f2233]'}`}>
                    <img src={img} alt={`Product ${idx}`} className="w-full h-32 object-cover" />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {idx !== 0 && (
                        <button type="button" onClick={() => setPrimaryImage(idx)} className="p-1 bg-[#0a0c13]/80 text-emerald-400 hover:text-emerald-300 rounded" title="Set as Primary">
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(idx)} className="p-1 bg-[#0a0c13]/80 text-red-400 hover:text-red-300 rounded" title="Remove">
                        ×
                      </button>
                    </div>
                    {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/80 text-center text-xs text-white py-1 font-medium">Primary</div>}
                  </div>
                ))}
                <label className="flex items-center justify-center border-2 border-dashed border-[#1f2233] rounded-xl h-32 cursor-pointer hover:border-emerald-500 hover:bg-[#11141d] transition-colors">
                  <div className="text-center">
                    <span className="text-2xl block mb-1">+</span>
                    <span className="text-xs text-slate-400">Upload Images</span>
                  </div>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowCdnPicker(true)}
                  className="px-4 py-2 bg-[#1f2233] hover:bg-[#2a3040] text-slate-300 rounded-lg text-sm transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Browse CDN</span>
                </button>
              </div>
            </div>

            <CDNImagePicker
              isOpen={showCdnPicker}
              onClose={() => setShowCdnPicker(false)}
              onSelect={(url) => {
                setFormData(prev => ({
                  ...prev,
                  images: [...prev.images, url]
                }));
                setShowCdnPicker(false);
              }}
              defaultPath="PCs"
            />

            <div className="md:col-span-2 pt-4 border-t border-[#1f2233]">
              <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  name="isActive"
                  className="w-5 h-5 rounded bg-[#0a0c13] border-[#1f2233] text-emerald-500 focus:ring-emerald-500/20" 
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span className="font-medium">Product is Active and Publicly Visible</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2.5 bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddProductPage;
