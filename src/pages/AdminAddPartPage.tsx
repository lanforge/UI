import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import CDNImagePicker from '../components/CDNImagePicker';

const AdminAddPartPage: React.FC = () => {
  const [showCdnPicker, setShowCdnPicker] = useState(false);
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'cpu',
    brand: '',
    model: '',
    sku: '',
    price: '',
    compareAtPrice: '',
    cost: '',
    stock: '',
    isActive: true,
    productUrl: '',
    tags: '',
    images: [] as string[]
  });
  const [isScraping, setIsScraping] = useState(false);

  const [specs, setSpecs] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isEditing && id) {
      api.get(`/pc-parts/admin/${id}`)
        .then(res => {
          const part = res.data.part;
          setFormData({
            category: part.type || 'cpu',
            brand: part.brand || '',
            model: part.partModel || part.model || '',
            sku: part.sku || '',
            price: part.price != null ? part.price.toString() : '0',
            compareAtPrice: part.compareAtPrice != null ? part.compareAtPrice.toString() : '',
            cost: part.cost != null ? part.cost.toString() : '0',
            stock: part.stock != null ? part.stock.toString() : '0',
            isActive: part.isActive !== false,
            productUrl: part.productUrl || '',
            tags: part.tags && part.tags.length > 0 ? part.tags.join(', ') : '',
            images: part.images || []
          });
          setSpecs(part.specs || {});
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch part data.');
        });
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'category') {
      setSpecs({}); // Reset specs when category changes
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSpecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSpecs(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadData = new FormData();
    Array.from(e.target.files).forEach(f => uploadData.append('images', f));

    let folder = 'Parts';
    if (formData.category) {
      folder = `Parts/${formData.category}`;
    }
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

  const handleScrape = async () => {
    if (!formData.productUrl) {
      setError('Please enter a Product URL first');
      return;
    }
    
    setIsScraping(true);
    setError(null);
    try {
      const res = await api.post('/pc-parts/scrape-link', { url: formData.productUrl });
      const details = res.data.details;
      
      if (details) {
        setFormData(prev => ({
          ...prev,
          brand: details.brand || prev.brand,
          model: details.model || details.name || prev.model,
          price: details.price ? details.price.toString() : prev.price,
          cost: details.cost ? details.cost.toString() : prev.cost,
        }));
        
        // Generate a random SKU if empty
        if (!formData.sku) {
          setFormData(prev => ({
            ...prev,
            sku: `PART-${Math.floor(100000 + Math.random() * 900000)}`
          }));
        }
      }
    } catch (err: any) {
      console.error('Scrape failed', err);
      setError(`Failed to auto-fill: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Clean specs by removing empty strings
    const cleanedSpecs = Object.fromEntries(
      Object.entries(specs).filter(([_, v]) => v !== '' && v !== null && !Number.isNaN(v))
    );

    try {
      const payload = {
        type: formData.category,
        brand: formData.brand,
        model: formData.model, // backend validator checks for 'model', then maps to partModel internally
        sku: formData.sku,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock, 10),
        specs: Object.keys(cleanedSpecs).length > 0 ? cleanedSpecs : { _empty: true }, // Add dummy key if empty to satisfy required Mixed type
        isActive: formData.isActive,
        productUrl: formData.productUrl || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        images: formData.images
      };

      if (isEditing && id) {
        await api.put(`/pc-parts/${id}`, payload);
      } else {
        await api.post('/pc-parts', payload);
      }
      navigate('/admin/parts');
    } catch (err: any) {
      console.error('Failed to save part', err);
      if (err.response?.data?.errors) {
        const errorMsgs = err.response.data.errors.map((e: any) => `${e.param || e.path}: ${e.msg}`).join(', ');
        setError(`Validation failed: ${errorMsgs}`);
      } else {
        setError(err.response?.data?.message || 'Failed to save part. Check your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSpecsFields = () => {
    switch (formData.category) {
      case 'cpu':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Cores</label>
              <input type="number" name="cores" value={specs.cores || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Threads</label>
              <input type="number" name="threads" value={specs.threads || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Base Clock (GHz)</label>
              <input type="number" step="0.1" name="baseClock" value={specs.baseClock || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Socket</label>
              <input type="text" name="socket" placeholder="e.g. AM5" value={specs.socket || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">TDP (Watts)</label>
              <input type="number" name="tdp" value={specs.tdp || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'gpu':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">VRAM (GB)</label>
              <input type="number" name="vram" value={specs.vram || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">VRAM Type</label>
              <input type="text" name="vramType" value={specs.vramType || ''} placeholder="e.g. GDDR6X" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Length (mm)</label>
              <input type="number" name="length" value={specs.length || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">TDP (Watts)</label>
              <input type="number" name="tdp" value={specs.tdp || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'ram':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Total Capacity (GB)</label>
              <input type="number" name="capacity" value={specs.capacity || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Module Count</label>
              <input type="number" name="modules" value={specs.modules || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Speed (MT/s)</label>
              <input type="number" name="speed" value={specs.speed || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
              <input type="text" name="type" value={specs.type || ''} placeholder="e.g. DDR5" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'motherboard':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Socket</label>
              <input type="text" name="socket" value={specs.socket || ''} placeholder="e.g. AM5" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Form Factor</label>
              <input type="text" name="formFactor" value={specs.formFactor || ''} placeholder="e.g. ATX" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Chipset</label>
              <input type="text" name="chipset" value={specs.chipset || ''} placeholder="e.g. X670E" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Memory Type</label>
              <input type="text" name="memoryType" value={specs.memoryType || ''} placeholder="e.g. DDR5" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'storage':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Capacity (GB)</label>
              <input type="number" name="capacity" value={specs.capacity || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
              <input type="text" name="type" value={specs.type || ''} placeholder="e.g. NVMe" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Interface</label>
              <input type="text" name="interface" value={specs.interface || ''} placeholder="e.g. PCIe 4.0" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'psu':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Wattage</label>
              <input type="number" name="wattage" value={specs.wattage || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Efficiency Rating</label>
              <input type="text" name="efficiency" value={specs.efficiency || ''} placeholder="e.g. 80+ Gold" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Modular</label>
              <input type="text" name="modular" value={specs.modular || ''} placeholder="e.g. Full" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'case':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Form Factor</label>
              <input type="text" name="formFactor" value={specs.formFactor || ''} placeholder="e.g. Mid Tower" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Max GPU Length (mm)</label>
              <input type="number" name="maxGpuLength" value={specs.maxGpuLength || ''} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Side Panel</label>
              <input type="text" name="sidePanelType" value={specs.sidePanelType || ''} placeholder="e.g. Tempered Glass" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'cpu-cooler':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
              <input type="text" name="type" value={specs.type || ''} placeholder="e.g. Air, AIO" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Radiator Size (mm, if AIO)</label>
              <input type="number" name="radiatorSize" value={specs.radiatorSize || ''} placeholder="e.g. 240, 360" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Height (mm, if Air)</label>
              <input type="number" name="height" value={specs.height || ''} placeholder="e.g. 158" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">RPM</label>
              <input type="text" name="rpm" value={specs.rpm || ''} placeholder="e.g. 500-2000" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      case 'fan':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Size (mm)</label>
              <input type="number" name="size" value={specs.size || ''} placeholder="e.g. 120, 140" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">RPM</label>
              <input type="text" name="rpm" value={specs.rpm || ''} placeholder="e.g. 500-2000" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Airflow (CFM)</label>
              <input type="number" name="airflow" value={specs.airflow || ''} placeholder="e.g. 65.4" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Noise Level (dBA)</label>
              <input type="number" name="noiseLevel" value={specs.noiseLevel || ''} placeholder="e.g. 29.5" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl" onChange={handleSpecChange} />
            </div>
          </>
        );
      default:
        return (
          <div className="md:col-span-2 text-slate-500 text-sm">
            Select a specific category to see relevant specification fields. All fields are optional.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button 
            onClick={() => navigate('/admin/parts')}
            className="text-slate-400 hover:text-white flex items-center space-x-2 text-sm mb-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Parts</span>
          </button>
          <h1 className="text-xl font-medium text-white">{isEditing ? 'Edit PC Part' : 'Add New PC Part'}</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="admin-card p-6 space-y-6">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-4">General Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Category *</label>
              <select
                name="category"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="cpu">CPU</option>
                <option value="gpu">GPU</option>
                <option value="motherboard">Motherboard</option>
                <option value="ram">RAM</option>
                <option value="storage">Storage</option>
                <option value="psu">Power Supply</option>
                <option value="case">Case</option>
                <option value="cpu-cooler">CPU Cooler</option>
                <option value="fan">Case Fan</option>
                <option value="os">Operating System</option>
              </select>
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
              <label className="block text-sm font-medium text-slate-400 mb-2">Brand *</label>
              <input
                type="text"
                name="brand"
                required
                placeholder="e.g. AMD, NVIDIA, Corsair"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.brand}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Model *</label>
              <input
                type="text"
                name="model"
                required
                placeholder="e.g. Ryzen 9 7950X"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.model}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Retail Price ($) *</label>
              <input
                type="number"
                name="price"
                step="0.01"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
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
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.compareAtPrice}
                onChange={handleChange}
                placeholder="Optional slash-through price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Internal Cost ($)</label>
              <input
                type="number"
                name="cost"
                step="0.01"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Initial Stock Quantity *</label>
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
              <label className="block text-sm font-medium text-slate-400 mb-2">Tags / Colors (comma-separated)</label>
              <input
                type="text"
                name="tags"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                placeholder={['motherboard', 'case', 'cpu-cooler', 'fan'].includes(formData.category) ? "e.g. White, Black, RGB, ARGB" : "e.g. RGB, Low-Profile"}
                value={formData.tags}
                onChange={handleChange}
              />
              {['motherboard', 'case', 'cpu-cooler', 'fan'].includes(formData.category) && (
                <p className="text-xs text-emerald-400 mt-2">Hint: Use tags to specify the color of this {formData.category} (e.g. 'White', 'Black')</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Product URL (Amazon, Newegg, etc.)</label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  name="productUrl"
                  className="admin-input flex-1 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                  placeholder="https://www.amazon.com/dp/B0..."
                  value={formData.productUrl}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={handleScrape}
                  disabled={isScraping || !formData.productUrl}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl transition-colors font-medium flex items-center whitespace-nowrap"
                >
                  {isScraping ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scraping...
                    </>
                  ) : (
                    'Auto-fill from URL'
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Paste a URL and click Auto-fill to instantly populate the Brand, Model, and Price.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Part Images</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className={`relative rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-emerald-500' : 'border-[#1f2233]'}`}>
                    <img src={img} alt={`Part ${idx}`} className="w-full h-32 object-cover" />
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
              defaultPath={`Parts/${formData.category}`}
            />

            <div className="pt-8 md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  name="isActive"
                  className="w-5 h-5 rounded bg-[#0a0c13] border-[#1f2233] text-emerald-500 focus:ring-emerald-500/20" 
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span className="font-medium">Part is Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="admin-card p-6 space-y-6">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-4 uppercase tracking-wider text-emerald-500">
            {formData.category} Specifications
          </h2>
          <p className="text-sm text-slate-400 mb-4">All technical specifications are optional but highly recommended.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSpecsFields()}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/parts')}
            className="px-6 py-2.5 bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Part'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddPartPage;
