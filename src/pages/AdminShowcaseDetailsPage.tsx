import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface PCPart {
  _id: string;
  partModel: string;
  type: string;
  brand: string;
  cost: number;
  price?: number;
}

const AdminShowcaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [availableParts, setAvailableParts] = useState<PCPart[]>([]);
  const [selectedCoreParts, setSelectedCoreParts] = useState<Record<string, string>>({
    cpu: '', gpu: '', motherboard: '', ram: '', storage: '', psu: '', case: '', 'cpu-cooler': '', os: ''
  });
  const [selectedFans, setSelectedFans] = useState<string[]>([]);
  
  const [buildFeePercentage, setBuildFeePercentage] = useState<number>(10);
  const [formData, setFormData] = useState({
    name: '',
    creatorName: '',
    creatorCode: '',
    description: '',
    laborFee: '99.99',
    images: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const bizRes = await api.get('/business/public');
      if (bizRes.data.businessInfo?.buildFeePercentage !== undefined) {
        setBuildFeePercentage(bizRes.data.businessInfo.buildFeePercentage);
      }
    } catch (e) {
      console.error(e);
    }
    try {
      const partsRes = await api.get(`/pc-parts/admin/all`, {
        params: { limit: 1000 }
      });
      setAvailableParts(partsRes.data.parts || []);
      
      const scRes = await api.get(`/showcases/admin/${id}`);
      const sc = scRes.data.showcase;
      
      setFormData({
        name: sc.name || '',
        creatorName: sc.creatorName || '',
        creatorCode: sc.creatorCode || '',
        description: sc.description || '',
        laborFee: sc.laborFee?.toString() || '99.99',
        images: sc.images || [],
        isActive: sc.isActive !== false,
      });
      
      const coreMap: Record<string, string> = {
        cpu: '', gpu: '', motherboard: '', ram: '', storage: '', psu: '', case: '', 'cpu-cooler': '', os: ''
      };
      const fans: string[] = [];
      
      if (sc.parts) {
        sc.parts.forEach((p: any) => {
          if (!p.part) return;
          const partId = typeof p.part === 'string' ? p.part : p.part._id;
          if (p.partType === 'fan') {
            fans.push(partId);
          } else {
            coreMap[p.partType] = partId;
          }
        });
      }
      setSelectedCoreParts(coreMap);
      setSelectedFans(fans);
      
    } catch (error) {
      setErrorMsg('Failed to load showcase details');
      navigate('/admin/showcases');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadData = new FormData();
    Array.from(e.target.files).forEach(f => uploadData.append('images', f));
    uploadData.append('folder', 'showcases');

    try {
      const res = await api.post(`/uploads/images`, uploadData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...res.data.urls]
      }));
    } catch (err) {
      console.error('Image upload failed', err);
      setErrorMsg('Failed to upload image(s).');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const recalculateFee = (coreMap: Record<string, string>, fans: string[], feePct: number) => {
    let subtotal = 0;
    Object.values(coreMap).forEach(partId => {
      const part = availableParts.find(p => p._id === partId);
      if (part) subtotal += (part.price || part.cost || 0);
    });
    fans.forEach(partId => {
      const part = availableParts.find(p => p._id === partId);
      if (part) subtotal += (part.price || part.cost || 0);
    });

    let calculatedBuildFee = subtotal * (feePct / 100);
    if (calculatedBuildFee > 0) {
      const tens = Math.floor(calculatedBuildFee / 10) * 10;
      const opt1 = tens + 5.99;
      const opt2 = tens + 9.99;
      const opt3 = tens + 15.99;
      
      if (calculatedBuildFee <= opt1) {
        calculatedBuildFee = opt1;
      } else if (calculatedBuildFee <= opt2) {
        calculatedBuildFee = opt2;
      } else {
        calculatedBuildFee = opt3;
      }
    } else {
      calculatedBuildFee = 99.99;
    }

    setFormData(prev => ({ ...prev, laborFee: calculatedBuildFee.toFixed(2) }));
  };

  const handleCorePartSelect = (category: string, partId: string) => {
    setSelectedCoreParts(prev => {
      const next = { ...prev, [category]: partId };
      recalculateFee(next, selectedFans, buildFeePercentage);
      return next;
    });
  };

  const toggleFan = (partId: string) => {
    setSelectedFans(prev => {
      const next = prev.includes(partId) ? prev.filter(id => id !== partId) : [...prev, partId];
      recalculateFee(selectedCoreParts, next, buildFeePercentage);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const partsPayload: any[] = [];
      Object.entries(selectedCoreParts).forEach(([type, partId]) => {
        if (partId) {
          partsPayload.push({ part: partId, partType: type, quantity: 1 });
        }
      });
      selectedFans.forEach(partId => {
        partsPayload.push({ part: partId, partType: 'fan', quantity: 1 });
      });

      await api.put(
        `/showcases/${id}`,
        {
          ...formData,
          laborFee: parseFloat(formData.laborFee),
          parts: partsPayload,
        }
      );
      setSuccessMsg('Showcase saved successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      setErrorMsg('Failed to save showcase');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading details...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm mb-4">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="float-right text-slate-400 hover:text-white">x</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl text-sm mb-4">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="float-right text-slate-400 hover:text-white">x</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button 
            onClick={() => navigate('/admin/showcases')}
            className="text-slate-400 hover:text-white flex items-center space-x-2 text-sm mb-2"
          >
            &larr; Back to Showcases
          </button>
          <h1 className="text-xl font-medium text-white">Edit Showcase</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-medium text-white mb-4">Showcase Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Showcase Name</label>
              <input
                type="text"
                className="admin-input w-full bg-[#11141d] border-[#1f2233] rounded-lg text-white"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Creator Name</label>
              <input
                type="text"
                className="admin-input w-full bg-[#11141d] border-[#1f2233] rounded-lg text-white"
                value={formData.creatorName}
                onChange={e => setFormData({ ...formData, creatorName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Creator Code (URL slug)</label>
              <input
                type="text"
                className="admin-input w-full bg-[#11141d] border-[#1f2233] rounded-lg text-white lowercase"
                value={formData.creatorCode}
                onChange={e => setFormData({ ...formData, creatorCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Labor Fee ($)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="admin-input w-full bg-[#11141d] border-[#1f2233] rounded-lg text-white"
                  value={formData.laborFee}
                  onChange={e => setFormData({ ...formData, laborFee: e.target.value })}
                />
                <button 
                  type="button" 
                  onClick={() => recalculateFee(selectedCoreParts, selectedFans, buildFeePercentage)}
                  className="px-3 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg whitespace-nowrap text-sm font-medium transition-colors"
                >
                  Auto-Calc
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea
                className="admin-input w-full bg-[#11141d] border-[#1f2233] rounded-lg text-white"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Showcase Images (Streamer/PC Photos)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-[#1f2233]">
                    <img src={img} alt={`Showcase ${idx}`} className="w-full h-32 object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(idx)} 
                      className="absolute top-2 right-2 p-1 bg-[#0a0c13]/80 text-red-400 hover:text-red-300 rounded" 
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#1f2233] rounded-xl h-32 cursor-pointer hover:border-emerald-500 hover:bg-[#11141d] transition-colors">
                  <span className="text-2xl text-slate-400 mb-1">+</span>
                  <span className="text-xs text-slate-400">Upload Photos</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="md:col-span-2 flex items-center mt-2">
              <input
                type="checkbox"
                id="isActive"
                className="w-4 h-4 rounded bg-[#11141d] border-[#1f2233] text-emerald-500"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="ml-2 text-white">Active (Visible to public)</label>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-2">PC Parts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-slate-400 mb-1">{category.label}</label>
                <select
                  className="admin-input w-full bg-[#11141d] border-[#1f2233] rounded-lg text-white"
                  value={selectedCoreParts[category.id]}
                  onChange={e => handleCorePartSelect(category.id, e.target.value)}
                >
                  <option value="">-- None --</option>
                  {availableParts.filter(p => p.type === category.id).map(part => (
                    <option key={part._id} value={part._id}>
                      {part.brand} {part.partModel} (${(part.price || part.cost || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1f2233] pt-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">Case Fans</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-[#11141d] rounded-lg">
              {availableParts.filter(p => p.type === 'fan').map(part => (
                <label key={part._id} className="flex items-center space-x-2 cursor-pointer p-1">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-emerald-500"
                    checked={selectedFans.includes(part._id)}
                    onChange={() => toggleFan(part._id)}
                  />
                  <span className="text-white text-sm truncate">{part.brand} {part.partModel}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminShowcaseDetailsPage;
