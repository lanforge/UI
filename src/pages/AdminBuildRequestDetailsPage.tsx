import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Part {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  type: string;
  partModel?: string;
  brand?: string;
  cost?: number;
}

interface BuildRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  budget?: string;
  details: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  usage?: string;
  preferredBrands?: string;
  timeline?: string;
  status: string;
  rejectionReason?: string;
  quote?: {
    parts: { partId: any; name: string; price: number; quantity: number }[];
    laborCost: number;
    shipping: { provider: string; serviceLevel: string; amount: number };
    totalPrice: number;
    sentAt?: string;
  };
  createdAt: string;
}

const AdminBuildRequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<BuildRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [parts, setParts] = useState<Part[]>([]);
  const [buildFeePercentage, setBuildFeePercentage] = useState<number>(10);
  
  // Quote Builder State
  const [selectedParts, setSelectedParts] = useState<Record<string, string>>({});
  const [selectedCaseFans, setSelectedCaseFans] = useState<string[]>([]);
  const [laborCost, setLaborCost] = useState<number>(150);
  
  // Shipping State
  const [address, setAddress] = useState({
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [manualShipping, setManualShipping] = useState({ provider: 'Manual', serviceLevel: 'Standard', amount: 0 });
  const [useManualShipping, setUseManualShipping] = useState(false);
  
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  
  // Rejection State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        api.get('/business/public').then(res => {
          if (res.data?.businessInfo?.buildFeePercentage !== undefined) {
            setBuildFeePercentage(res.data.businessInfo.buildFeePercentage);
          }
        }).catch(err => console.error('Error fetching business info:', err));

        const reqRes = await api.get(`/build-requests/${id}`);
        const partsRes = await api.get('/pc-parts/admin/all?limit=1000');
        const partsList = partsRes.data?.parts || [];
        setParts(partsList);
        
        setRequest(reqRes.data);
        if (reqRes.data.address) {
          setAddress({
            street1: reqRes.data.address.street || '',
            city: reqRes.data.address.city || '',
            state: reqRes.data.address.state || '',
            zip: reqRes.data.address.zip || '',
            country: reqRes.data.address.country || 'US'
          });
        }
        if (reqRes.data.quote) {
          const partsRecord: Record<string, string> = {};
          const fans: string[] = [];
          
          reqRes.data.quote.parts.forEach((p: any) => {
             const pId = p.partId?._id || p.partId;
             const fullPart = partsList.find((part: any) => part._id === pId);
             
             if (fullPart) {
                const type = fullPart.type.toLowerCase();
                const typeMap: Record<string, string[]> = {
                   'case': ['case'],
                   'cpu': ['cpu'],
                   'motherboard': ['motherboard'],
                   'ram': ['ram', 'memory'],
                   'gpu': ['gpu', 'video card'],
                   'storage': ['storage', 'ssd', 'hdd', 'nvme', 'm.2'],
                   'cpu cooler': ['cooler', 'cpu-cooler', 'cpu cooler', 'liquid cooler', 'air cooler'],
                   'psu': ['psu', 'power supply'],
                   'os': ['os', 'operating system'],
                   'fans': ['fan', 'case fan', 'fans']
                };
                
                let foundCat = '';
                for (const [cat, types] of Object.entries(typeMap)) {
                   if (types.includes(type)) {
                      foundCat = cat.toLowerCase();
                      break;
                   }
                }
                
                if (foundCat === 'fans') {
                   for (let i = 0; i < p.quantity; i++) fans.push(pId);
                } else if (foundCat) {
                   partsRecord[foundCat] = pId;
                }
             }
          });
          
          setSelectedParts(partsRecord);
          setSelectedCaseFans(fans);
          setLaborCost(reqRes.data.quote.laborCost || 150);
          setUseManualShipping(true);
          setManualShipping(reqRes.data.quote.shipping || { provider: 'Manual', serviceLevel: 'Standard', amount: 0 });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const fetchShippingRates = async () => {
    setIsFetchingRates(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/shipping/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressTo: {
            name: request?.name || 'Customer',
            street1: address.street1,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShippingRates(data.rates || []);
        if (data.rates && data.rates.length > 0) {
          setSelectedShippingRate(data.rates[0]);
        }
      } else {
        alert('Error fetching rates: ' + (data.message || data.errors?.[0]?.msg || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching shipping rates');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const calculatePartsCost = () => {
    let sum = 0;
    Object.values(selectedParts).forEach(partId => {
      if (partId && partId !== 'none') {
        const part = parts.find(p => p._id === partId);
        if (part) sum += (part.price || 0);
      }
    });
    selectedCaseFans.forEach(partId => {
      if (partId && partId !== 'none') {
        const part = parts.find(p => p._id === partId);
        if (part) sum += (part.price || 0);
      }
    });
    return sum;
  };

  const handleAutoCalculateLabor = () => {
    const partsTotal = calculatePartsCost();
    if (partsTotal === 0) {
      setLaborCost(0);
      return;
    }
    let calculatedBuildFee = partsTotal * (buildFeePercentage / 100);
    if (calculatedBuildFee > 0) {
      const tens = Math.floor(calculatedBuildFee / 10) * 10;
      const opt1 = tens + 5.99;
      const opt2 = tens + 9.99;
      const opt3 = tens + 15.99;
      if (calculatedBuildFee <= opt1) calculatedBuildFee = opt1;
      else if (calculatedBuildFee <= opt2) calculatedBuildFee = opt2;
      else calculatedBuildFee = opt3;
    } else {
      calculatedBuildFee = 99.99;
    }
    setLaborCost(calculatedBuildFee);
  };

  const partsTotal = calculatePartsCost();
  const shippingCost = useManualShipping 
    ? (manualShipping?.amount || 0)
    : (selectedShippingRate ? parseFloat(selectedShippingRate.amount) : 0);
  const totalPrice = partsTotal + Number(laborCost) + shippingCost;

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for the customer.');
      return;
    }
    setIsRejecting(true);
    try {
      await api.put(`/build-requests/${id}`, {
        status: 'unbuildable',
        rejectionReason: rejectReason
      });
      alert('Request marked as unbuildable and email sent to customer.');
      navigate('/admin/build-requests');
    } catch (err: any) {
      console.error(err);
      alert('Failed to reject request: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsRejecting(false);
      setShowRejectModal(false);
    }
  };

  const handleSendQuote = async () => {
    const quotePartsArray: any[] = [];
    
    Object.entries(selectedParts).forEach(([type, partId]) => {
      if (partId && partId !== 'none') {
        const part = parts.find(p => p._id === partId);
        if (part) {
          quotePartsArray.push({
            partId: part._id,
            name: `${part.brand || ''} ${part.partModel || part.name}`.trim(),
            price: part.price || 0,
            quantity: 1
          });
        }
      }
    });

    selectedCaseFans.forEach((fanId) => {
      if (fanId && fanId !== 'none') {
        const part = parts.find(p => p._id === fanId);
        if (part) {
          const existing = quotePartsArray.find(p => p.partId === part._id);
          if (existing) {
            existing.quantity += 1;
          } else {
            quotePartsArray.push({
              partId: part._id,
              name: `${part.brand || ''} ${part.partModel || part.name}`.trim(),
              price: part.price || 0,
              quantity: 1
            });
          }
        }
      }
    });

    if (quotePartsArray.length === 0) {
      alert('Please add at least one part to the quote.');
      return;
    }
    
    let shippingData;
    if (useManualShipping) {
      shippingData = manualShipping;
    } else {
      if (!selectedShippingRate) {
        alert('Please calculate and select a shipping rate, or use manual shipping.');
        return;
      }
      shippingData = {
        provider: selectedShippingRate.provider || 'Shippo',
        serviceLevel: selectedShippingRate.title || 'Standard',
        amount: parseFloat(selectedShippingRate.amount)
      };
    }

    setIsSending(true);
    try {
      await api.post(`/build-requests/${id}/quote`, {
        parts: quotePartsArray,
        laborCost: Number(laborCost),
        shipping: shippingData,
        totalPrice
      });

      alert('Quote saved and emailed successfully!');
      navigate('/admin/build-requests');
    } catch (err: any) {
      console.error(err);
      alert('Failed to send quote: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (!request) return <div className="p-8 text-center text-red-500">Request not found</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/build-requests')}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-medium text-white">Build Request Details</h1>
        </div>
        <div className="flex items-center gap-3">
          {request.status !== 'unbuildable' && request.status !== 'completed' && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-4 py-2 bg-red-600/10 text-red-500 hover:bg-red-600/20 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
            >
              Mark Unbuildable
            </button>
          )}
          <div className="px-3 py-1 bg-[#11141d] rounded-full text-sm font-medium">
            Status: <span className={`capitalize ${request.status === 'unbuildable' ? 'text-red-400' : 'text-emerald-400'}`}>{request.status}</span>
          </div>
        </div>
      </div>

      {request.status === 'unbuildable' && (
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
          <h3 className="text-red-400 font-medium mb-1">Marked as Unbuildable</h3>
          <p className="text-slate-300 text-sm">Reason sent to customer: {request.rejectionReason || 'No reason provided'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl overflow-hidden h-max">
          <div className="px-6 py-4 border-b border-[#1f2233]">
            <h2 className="text-lg font-medium text-white">Customer Info</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Name</div>
              <div className="font-medium text-white">{request.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Email</div>
              <div className="font-medium text-white">
                <a href={`mailto:${request.email}`} className="text-emerald-400 hover:underline">{request.email}</a>
              </div>
            </div>
            {request.phone && (
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Phone</div>
                <div className="font-medium text-white">{request.phone}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Budget</div>
              <div className="font-medium text-emerald-400">{request.budget || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Submitted</div>
              <div className="text-sm text-slate-300">{new Date(request.createdAt).toLocaleString()}</div>
            </div>
            <div className="pt-4 border-t border-[#1f2233]">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Usage</div>
              <div className="text-sm text-slate-300">{request.usage || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Preferred Brands</div>
              <div className="text-sm text-slate-300">{request.preferredBrands || 'Not specified'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Timeline</div>
              <div className="text-sm text-slate-300">{request.timeline || 'Not specified'}</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f2233]">
              <h2 className="text-lg font-medium text-white">Request Details</h2>
            </div>
            <div className="p-6">
              <div className="whitespace-pre-wrap text-slate-300 text-sm bg-gray-950 p-4 rounded-lg border border-[#1f2233]">
                {request.details}
              </div>
            </div>
          </div>

          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f2233] flex justify-between items-center">
              <h2 className="text-lg font-medium text-white">Quote Builder</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Case', 'CPU', 'Motherboard', 'RAM', 'GPU', 'Storage', 'CPU Cooler', 'PSU', 'OS'].map((category) => {
                  const typeMap: Record<string, string[]> = {
                    'Case': ['case'],
                    'CPU': ['cpu'],
                    'Motherboard': ['motherboard'],
                    'RAM': ['ram', 'memory'],
                    'GPU': ['gpu', 'video card'],
                    'Storage': ['storage', 'ssd', 'hdd', 'nvme', 'm.2'],
                    'CPU Cooler': ['cooler', 'cpu-cooler', 'cpu cooler', 'liquid cooler', 'air cooler'],
                    'PSU': ['psu', 'power supply'],
                    'OS': ['os', 'operating system']
                  };
                  const types = typeMap[category] || [];
                  const options = parts.filter(p => types.includes((p.type || '').toLowerCase()));
                  
                  return (
                    <div key={category}>
                      <label className="block text-sm font-medium text-slate-400 mb-1">{category}</label>
                      <select
                        className="w-full bg-[#0a0c13] border border-[#1f2233] focus:border-emerald-500 rounded-md h-10 px-3 text-sm text-white"
                        value={selectedParts[category.toLowerCase()] || ''}
                        onChange={(e) => setSelectedParts({...selectedParts, [category.toLowerCase()]: e.target.value})}
                      >
                        <option value="none">-- Select {category} --</option>
                        {options.map(o => (
                          <option key={o._id} value={o._id}>{o.partModel || o.name} (${o.price})</option>
                        ))}
                      </select>
                    </div>
                  );
                })}

                <div className="md:col-span-2 mt-2 pt-4 border-t border-[#1f2233]">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-400">Case Fans</label>
                    <button
                      type="button"
                      onClick={() => setSelectedCaseFans([...selectedCaseFans, ''])}
                      className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
                    >
                      + Add Fan
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedCaseFans.map((fanId, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          className="flex-1 bg-[#0a0c13] border border-[#1f2233] focus:border-emerald-500 rounded-md h-10 px-3 text-sm text-white"
                          value={fanId}
                          onChange={(e) => {
                            const newFans = [...selectedCaseFans];
                            newFans[idx] = e.target.value;
                            setSelectedCaseFans(newFans);
                          }}
                        >
                          <option value="none">-- Select Case Fan --</option>
                          {parts
                            .filter(p => ['fan', 'case fan', 'fans'].includes((p.type || '').toLowerCase()))
                            .map(o => (
                              <option key={o._id} value={o._id}>{o.partModel || o.name} (${o.price})</option>
                            ))
                          }
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const newFans = [...selectedCaseFans];
                            newFans.splice(idx, 1);
                            setSelectedCaseFans(newFans);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md border border-red-500/20 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {selectedCaseFans.length === 0 && (
                      <div className="text-xs text-slate-500 italic">No extra case fans added.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t border-[#1f2233]">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-300">Shipping Details</h4>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="manualShipping" 
                      checked={useManualShipping} 
                      onChange={(e) => setUseManualShipping(e.target.checked)}
                      className="rounded border-[#1f2233] bg-[#0a0c13] text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="manualShipping" className="text-sm text-slate-300">Enter shipping manually</label>
                  </div>
                  
                  {useManualShipping ? (
                    <div className="space-y-3 bg-[#11141d] p-4 rounded-lg">
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Provider / Service</label>
                        <input 
                          type="text"
                          value={manualShipping?.serviceLevel || ''}
                          onChange={(e) => setManualShipping({...manualShipping, serviceLevel: e.target.value})}
                          className="w-full bg-[#0a0c13] border border-[#1f2233] rounded-md h-9 px-3 text-sm text-white"
                          placeholder="e.g. UPS Ground"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Cost ($)</label>
                        <input 
                          type="number"
                          value={manualShipping?.amount || 0}
                          onChange={(e) => setManualShipping({...manualShipping, amount: parseFloat(e.target.value) || 0})}
                          className="w-full bg-[#0a0c13] border border-[#1f2233] rounded-md h-9 px-3 text-sm text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-[#11141d] p-4 rounded-lg">
                      <div>
                        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Street</label>
                        <input 
                          type="text"
                          value={address.street1} 
                          onChange={e => setAddress({...address, street1: e.target.value})} 
                          className="w-full bg-[#0a0c13] border border-[#1f2233] rounded-md h-9 px-3 text-sm text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">City</label>
                          <input 
                            type="text"
                            value={address.city} 
                            onChange={e => setAddress({...address, city: e.target.value})} 
                            className="w-full bg-[#0a0c13] border border-[#1f2233] rounded-md h-9 px-3 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">State / ZIP</label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={address.state} 
                              onChange={e => setAddress({...address, state: e.target.value})} 
                              className="w-16 bg-[#0a0c13] border border-[#1f2233] rounded-md h-9 px-2 text-center text-sm text-white" 
                              placeholder="FL" 
                            />
                            <input 
                              type="text"
                              value={address.zip} 
                              onChange={e => setAddress({...address, zip: e.target.value})} 
                              className="flex-1 bg-[#0a0c13] border border-[#1f2233] rounded-md h-9 px-3 text-sm text-white" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={fetchShippingRates}
                        disabled={isFetchingRates || !address.street1 || !address.zip}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                      >
                        {isFetchingRates ? (
                          <span>Calculating...</span>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Calculate Live Rates
                          </>
                        )}
                      </button>
                      
                      {shippingRates.length > 0 && (
                        <div className="mt-3">
                          <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Select Rate</label>
                          <select 
                            value={selectedShippingRate?.objectId || ''} 
                            onChange={(e) => setSelectedShippingRate(shippingRates.find(r => r.objectId === e.target.value))}
                            className="w-full bg-[#0a0c13] border border-[#1f2233] rounded-md h-9 px-3 text-sm text-white"
                          >
                            <option value="">Select a rate</option>
                            {shippingRates.map((rate: any) => (
                              <option key={rate.objectId} value={rate.objectId}>
                                {rate.title} - ${rate.amount} ({rate.estimatedDays} days)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-slate-300">Quote Summary</h4>
                      <button
                        onClick={handleAutoCalculateLabor}
                        className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors"
                      >
                        Auto-Calc Labor
                      </button>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-lg border border-[#1f2233] space-y-3 text-sm">
                      <div className="flex justify-between text-slate-400">
                        <span>Parts Total:</span>
                        <span className="text-white font-medium">${partsTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 items-center">
                        <span>Labor Cost:</span>
                        <div className="w-24">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input 
                              type="number" 
                              value={laborCost} 
                              onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)} 
                              className="w-full bg-[#0a0c13] border border-[#1f2233] rounded-md h-8 pl-7 pr-2 text-right text-white" 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Shipping:</span>
                        <span className="text-white font-medium">${shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-[#1f2233] pt-3 mt-3 flex justify-between font-medium text-base">
                        <span className="text-white">Total:</span>
                        <span className="text-emerald-400">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <button 
                      onClick={handleSendQuote}
                      disabled={isSending || (Object.keys(selectedParts).length === 0 && selectedCaseFans.length === 0)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Save & Email Quote
                        </>
                      )}
                    </button>
                    
                    {request.quote && request.quote.sentAt && (
                      <p className="text-xs text-center text-slate-500 mt-2">
                        Last quote sent on {new Date(request.quote.sentAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-medium text-white mb-2">Mark Request as Unbuildable</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will update the request status and send an email to the customer letting them know why we cannot fulfill their request.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Reason for Customer</label>
                <textarea
                  className="w-full bg-gray-950 border border-[#1f2233] rounded-lg p-3 text-white h-32 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="e.g. The requested budget is too low for the parts specified..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-[#11141d] hover:bg-[#1f2233] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center"
                >
                  {isRejecting ? 'Sending...' : 'Confirm & Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBuildRequestDetailsPage;
