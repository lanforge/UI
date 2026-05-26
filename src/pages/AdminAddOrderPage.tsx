import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminAddOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [productType, setProductType] = useState<'standard' | 'custom-product' | 'custom-build'>('standard');
  const [customBuildData, setCustomBuildData] = useState<any>(null);
  const [customBuildError, setCustomBuildError] = useState<string | null>(null);
  const [pcParts, setPcParts] = useState<any[]>([]);
  const [selectedParts, setSelectedParts] = useState<Record<string, string>>({});
  const [selectedCaseFans, setSelectedCaseFans] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    customProductName: '',
    customProductPrice: '',
    customBuildId: '',
    quantity: 1,
  });

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const [shippoRates, setShippoRates] = useState<any[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<string>('');
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  
  const [addInsurance, setAddInsurance] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes, partsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products/admin/all'),
          api.get('/pc-parts/admin/all?limit=200')
        ]);
        setCustomers(custRes.data.customers || []);
        setProducts(prodRes.data.products || []);
        setPcParts(partsRes.data.parts || []);
      } catch (err) {
        console.error('Failed to load form dependencies', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.customerId) {
      api.get(`/customers/${formData.customerId}`)
        .then(res => {
          const selectedCustomer = res.data.customer;
          if (selectedCustomer) {
            setSelectedCustomerData(selectedCustomer);
            const addr = selectedCustomer.addresses?.find((a: any) => a.type === 'shipping' || a.type === 'both') || selectedCustomer.addresses?.[0];
            if (addr) {
              setShippingAddress({
                name: `${addr.firstName || selectedCustomer.firstName} ${addr.lastName || selectedCustomer.lastName}`.trim(),
                street1: addr.street || '',
                street2: '',
                city: addr.city || '',
                state: addr.state || '',
                zip: addr.zip || '',
                country: addr.country || 'US'
              });
            } else {
              setShippingAddress(prev => ({
                ...prev,
                name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.trim(),
                street1: '',
                street2: '',
                city: '',
                state: '',
                zip: '',
                country: 'US'
              }));
            }
          }
        })
        .catch(err => {
          console.error("Failed to fetch customer details", err);
          const selectedCustomer = customers.find(c => c._id === formData.customerId);
          if (selectedCustomer) {
            setSelectedCustomerData(selectedCustomer);
            setShippingAddress(prev => ({
              ...prev,
              name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.trim()
            }));
          }
        });
    } else {
      setSelectedCustomerData(null);
      setShippingAddress({
        name: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US'
      });
      setShippoRates([]);
      setSelectedShippingRate('');
    }
  }, [formData.customerId, customers]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVerifyBuild = async () => {
    setCustomBuildError(null);
    setCustomBuildData(null);
    if (!formData.customBuildId) {
      setCustomBuildError('Please enter a Build ID.');
      return;
    }
    try {
      const res = await api.get(`/custom-builds/${formData.customBuildId}`);
      if (res.data.build) {
        setCustomBuildData(res.data.build);
      }
    } catch (err: any) {
      setCustomBuildError(err.response?.data?.message || 'Failed to verify custom build. Check the ID.');
    }
  };

  const calculateCurrentItem = () => {
    let item: any = null;
    let itemPrice = 0;
    let itemParts: any[] = [];

    if (productType === 'custom-product') {
      if (formData.customProductName && formData.customProductPrice) {
        itemPrice = Number(formData.customProductPrice);
        item = {
          name: formData.customProductName,
          sku: 'CUSTOM',
          price: itemPrice,
          quantity: Number(formData.quantity)
        };
      }
    } else if (productType === 'custom-build') {
      if (customBuildData) {
        itemPrice = customBuildData.total;
        item = {
          customBuild: customBuildData._id,
          name: customBuildData.name || 'Custom Build',
          sku: `CB-${customBuildData.buildId}`,
          price: itemPrice,
          quantity: Number(formData.quantity)
        };
      } else {
        const selectedPartsArray: any[] = [];
        let calcSubtotal = 0;
        
        Object.entries(selectedParts).forEach(([type, partId]) => {
          if (partId && partId !== 'none') {
            const part = pcParts.find(p => p._id === partId);
            if (part) {
              selectedPartsArray.push({
                partType: type,
                part: part._id,
                quantity: 1,
                name: `${part.brand} ${part.partModel}`
              });
              calcSubtotal += (part.cost ?? part.price ?? 0);
            }
          }
        });

        selectedCaseFans.forEach((fanId) => {
          if (fanId && fanId !== 'none') {
            const part = pcParts.find(p => p._id === fanId);
            if (part) {
              const existing = selectedPartsArray.find(p => p.part === part._id && p.partType === 'case fans');
              if (existing) {
                existing.quantity += 1;
              } else {
                selectedPartsArray.push({
                  partType: 'case fans',
                  part: part._id,
                  quantity: 1,
                  name: `${part.brand} ${part.partModel}`
                });
              }
              calcSubtotal += (part.cost ?? part.price ?? 0);
            }
          }
        });

        if (selectedPartsArray.length > 0) {
          const markedUpSubtotal = calcSubtotal * 1.20;
          itemPrice = markedUpSubtotal;
          itemParts = selectedPartsArray;
          item = {
            name: 'Custom Build',
            sku: 'CUSTOM-BUILD',
            price: itemPrice,
            quantity: Number(formData.quantity),
            customBuildParts: selectedPartsArray
          };
        }
      }
    } else {
      if (formData.productId) {
        const selectedProduct = products.find(p => p._id === formData.productId);
        if (selectedProduct) {
          itemPrice = selectedProduct.price;
          item = {
            product: selectedProduct._id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            price: itemPrice,
            quantity: Number(formData.quantity)
          };
        }
      }
    }

    return { item, itemPrice, itemParts };
  };

  const getSelectedShippingCost = () => {
    const rate = shippoRates.find(r => r.objectId === selectedShippingRate);
    return rate ? parseFloat(rate.amount) : 0;
  };

  const calculateInsuranceCost = () => {
    if (!addInsurance) return 0;
    const { itemPrice } = calculateCurrentItem();
    const subtotal = itemPrice * Number(formData.quantity);
    const shipping = getSelectedShippingCost();
    return Math.max(0, subtotal + shipping) * 0.0125;
  };

  const fetchRates = async () => {
    setIsFetchingRates(true);
    setShippingError(null);
    setShippoRates([]);
    
    try {
      const addressTo = {
        name: shippingAddress.name || 'Customer',
        street1: shippingAddress.street1,
        street2: shippingAddress.street2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || 'US',
      };
  
      const { item, itemPrice } = calculateCurrentItem(); 
  
      if (!item || !addressTo.street1 || !addressTo.city || !addressTo.state || !addressTo.zip) {
        setShippingError('Please fill out product details and complete shipping address first.');
        setIsFetchingRates(false);
        return;
      }
  
      const lineItems = [{
        currency: 'USD',
        manufacture_country: 'US',
        quantity: Number(formData.quantity),
        sku: item.sku || 'SKU',
        title: item.name,
        total_price: itemPrice.toString(),
        weight: '10', // Default
        weight_unit: 'lb'
      }];
  
      const res = await api.post('/shipping/rates', { addressTo, lineItems });
  
      if (res.data && res.data.rates) {
        const finalRates = res.data.rates || [];
        setShippoRates(finalRates);
        if (finalRates.length > 0) {
          setSelectedShippingRate(finalRates[0].objectId);
        } else {
          setShippingError('No shipping methods available for this address.');
        }
      } else {
        setShippingError('Failed to calculate shipping rates.');
      }
    } catch (err: any) {
      setShippingError(err.response?.data?.message || 'Error calculating shipping rates.');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.customerId) {
      setError('Please select a customer.');
      setIsSubmitting(false);
      return;
    }

    const { item, itemPrice } = calculateCurrentItem();

    if (!item) {
      setError('Please provide valid product details.');
      setIsSubmitting(false);
      return;
    }

    if (!selectedShippingRate && shippoRates.length > 0) {
      setError('Please select a shipping rate.');
      setIsSubmitting(false);
      return;
    }

    try {
      const shippingAmount = getSelectedShippingCost();
      const insuranceAmount = calculateInsuranceCost();
      const totalCost = (itemPrice * Number(formData.quantity)) + shippingAmount + insuranceAmount;
      const isFree = totalCost === 0;

      const payload = {
        customer: formData.customerId,
        items: [item],
        status: 'order-confirmed',
        paymentStatus: isFree ? 'paid' : 'pending',
        paymentMethod: '',
        subtotal: itemPrice * Number(formData.quantity),
        shipping: shippingAmount,
        shippingInsurance: insuranceAmount,
        tax: 0,
        total: totalCost,
      };

      await api.post('/orders/admin', payload);

      // Save the address to the customer if it's new
      if (selectedCustomerData) {
        const existingAddresses = selectedCustomerData.addresses || [];
        const hasMatchingAddress = existingAddresses.some((a: any) => 
          a.street === shippingAddress.street1 &&
          a.city === shippingAddress.city &&
          a.state === shippingAddress.state &&
          a.zip === shippingAddress.zip
        );

        if (!hasMatchingAddress && shippingAddress.street1 && shippingAddress.city && shippingAddress.state && shippingAddress.zip) {
          const nameParts = shippingAddress.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const newAddress = {
            type: 'shipping',
            firstName,
            lastName,
            street: shippingAddress.street1 + (shippingAddress.street2 ? ` ${shippingAddress.street2}` : ''),
            city: shippingAddress.city,
            state: shippingAddress.state,
            zip: shippingAddress.zip,
            country: shippingAddress.country || 'US',
          };

          const updatedAddresses = [...existingAddresses, newAddress];
          await api.put(`/customers/${formData.customerId}`, { addresses: updatedAddresses }).catch(err => {
            console.error('Failed to update customer address', err);
          });
        }
      }

      navigate('/admin/orders');
    } catch (err: any) {
      console.error('Failed to create order', err);
      setError(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/admin/orders')}
            className="text-slate-400 hover:text-white flex items-center space-x-2 text-sm mb-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Orders</span>
          </button>
          <h1 className="text-xl font-medium text-white">Create Manual Order</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Customer *</label>
            <select
              name="customerId"
              required
              className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
              value={formData.customerId}
              onChange={handleChange}
            >
              <option value="">-- Choose a customer --</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.email})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 border-t border-[#1f2233] pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <label className="block text-sm font-medium text-slate-400">Product Selection</label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center space-x-2 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    value="standard"
                    checked={productType === 'standard'}
                    onChange={(e) => setProductType(e.target.value as any)}
                    className="text-emerald-500 focus:ring-emerald-500/20 bg-[#0a0c13] border-[#1f2233]"
                  />
                  <span>Standard</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    value="custom-product"
                    checked={productType === 'custom-product'}
                    onChange={(e) => setProductType(e.target.value as any)}
                    className="text-emerald-500 focus:ring-emerald-500/20 bg-[#0a0c13] border-[#1f2233]"
                  />
                  <span>Custom Product</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    value="custom-build"
                    checked={productType === 'custom-build'}
                    onChange={(e) => setProductType(e.target.value as any)}
                    className="text-emerald-500 focus:ring-emerald-500/20 bg-[#0a0c13] border-[#1f2233]"
                  />
                  <span>Custom Build</span>
                </label>
              </div>
            </div>

            {productType === 'standard' && (
              <select
                name="productId"
                required={productType === 'standard'}
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.productId}
                onChange={handleChange}
              >
                <option value="">-- Choose a product --</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>
                ))}
              </select>
            )}

            {productType === 'custom-product' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Custom Product Name *</label>
                  <input
                    type="text"
                    name="customProductName"
                    required={productType === 'custom-product'}
                    className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                    value={formData.customProductName}
                    onChange={handleChange}
                    placeholder="e.g. Special Keyboard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Custom Product Price ($) *</label>
                  <input
                    type="number"
                    name="customProductPrice"
                    min="0"
                    step="0.01"
                    required={productType === 'custom-product'}
                    className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                    value={formData.customProductPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {productType === 'custom-build' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-3 border-b border-[#1f2233] pb-2">Option 1: Verify Existing Build ID</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-400 mb-2">Custom Build ID</label>
                      <input
                        type="text"
                        name="customBuildId"
                        className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                        value={formData.customBuildId}
                        onChange={handleChange}
                        placeholder="e.g. A1B2C3D4"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyBuild}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors font-medium h-[42px]"
                    >
                      Verify ID
                    </button>
                  </div>
                  
                  {customBuildError && (
                    <div className="text-red-400 text-sm mt-1">{customBuildError}</div>
                  )}
                  
                  {customBuildData && (
                    <div className="mt-4 bg-[#11141d] p-4 rounded-xl border border-emerald-500/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-medium">{customBuildData.name || 'Custom Build'}</h4>
                          <p className="text-slate-400 text-sm">Status: {customBuildData.status}</p>
                          <p className="text-slate-400 text-sm">{customBuildData.parts?.length || 0} items</p>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-medium">${customBuildData.total?.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!customBuildData && (
                  <div className="pt-4">
                    <h3 className="text-white font-medium mb-3 border-b border-[#1f2233] pb-2">Option 2: Inline Custom Build</h3>
                    <p className="text-sm text-slate-400 mb-4">Select components directly here. A 20% system integration fee will be applied.</p>
                    
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
                        const options = pcParts.filter(p => types.includes(p.type.toLowerCase()));
                        
                        return (
                          <div key={category}>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{category}</label>
                            <select
                              className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                              value={selectedParts[category.toLowerCase()] || ''}
                              onChange={(e) => setSelectedParts({...selectedParts, [category.toLowerCase()]: e.target.value})}
                            >
                              <option value="none">-- Select {category} --</option>
                              {options.map(o => (
                                <option key={o._id} value={o._id}>{o.partModel || o.name} (${o.cost ?? o.price})</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}

                      {/* Multiple Case Fans Support */}
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
                                className="admin-input flex-1 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                                value={fanId}
                                onChange={(e) => {
                                  const newFans = [...selectedCaseFans];
                                  newFans[idx] = e.target.value;
                                  setSelectedCaseFans(newFans);
                                }}
                              >
                                <option value="">-- Select Case Fan --</option>
                                {pcParts
                                  .filter(p => ['fan', 'case fan', 'fans'].includes(p.type.toLowerCase()))
                                  .map(o => (
                                    <option key={o._id} value={o._id}>{o.partModel || o.name} (${o.cost ?? o.price})</option>
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
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
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
                    
                    {(Object.values(selectedParts).some(v => v && v !== 'none') || selectedCaseFans.some(f => f && f !== 'none')) && (
                      <div className="mt-4 p-4 bg-[#11141d] rounded-xl border border-[#1f2233]">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Inline Build Component Total (Cost):</span>
                          <span className="text-white font-medium">
                            ${(() => {
                              let sum = Object.entries(selectedParts).reduce((s, [type, id]) => {
                                if (id && id !== 'none') {
                                  const part = pcParts.find(p => p._id === id);
                                  return s + (part?.cost ?? part?.price ?? 0);
                                }
                                return s;
                              }, 0);
                              sum += selectedCaseFans.reduce((s, id) => {
                                if (id && id !== 'none') {
                                  const part = pcParts.find(p => p._id === id);
                                  return s + (part?.cost ?? part?.price ?? 0);
                                }
                                return s;
                              }, 0);
                              return sum.toFixed(2);
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-slate-400">System Integration & Validation (20%):</span>
                          <span className="text-emerald-400 font-medium">
                            +${(() => {
                              let sum = Object.entries(selectedParts).reduce((s, [type, id]) => {
                                if (id && id !== 'none') {
                                  const part = pcParts.find(p => p._id === id);
                                  return s + (part?.cost ?? part?.price ?? 0);
                                }
                                return s;
                              }, 0);
                              sum += selectedCaseFans.reduce((s, id) => {
                                if (id && id !== 'none') {
                                  const part = pcParts.find(p => p._id === id);
                                  return s + (part?.cost ?? part?.price ?? 0);
                                }
                                return s;
                              }, 0);
                              return (sum * 0.20).toFixed(2);
                            })()}
                          </span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#1f2233] flex justify-between items-center">
                          <span className="text-sm font-medium text-white">Total:</span>
                          <span className="text-lg text-emerald-400 font-medium">
                            ${(() => {
                              let sum = Object.entries(selectedParts).reduce((s, [type, id]) => {
                                if (id && id !== 'none') {
                                  const part = pcParts.find(p => p._id === id);
                                  return s + (part?.cost ?? part?.price ?? 0);
                                }
                                return s;
                              }, 0);
                              sum += selectedCaseFans.reduce((s, id) => {
                                if (id && id !== 'none') {
                                  const part = pcParts.find(p => p._id === id);
                                  return s + (part?.cost ?? part?.price ?? 0);
                                }
                                return s;
                              }, 0);
                              return (sum * 1.20).toFixed(2);
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              required
              className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
              value={formData.quantity}
              onChange={handleChange}
            />
          </div>

          <div className="md:col-span-2 border-t border-[#1f2233] pt-4 mt-2">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Shipping Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Name" value={shippingAddress.name} onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl" />
              <input type="text" placeholder="Street 1" value={shippingAddress.street1} onChange={(e) => setShippingAddress({...shippingAddress, street1: e.target.value})} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl" />
              <input type="text" placeholder="Street 2 (Opt)" value={shippingAddress.street2} onChange={(e) => setShippingAddress({...shippingAddress, street2: e.target.value})} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl" />
              <input type="text" placeholder="City" value={shippingAddress.city} onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl" />
              <input type="text" placeholder="State" value={shippingAddress.state} onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl" />
              <input type="text" placeholder="Zip" value={shippingAddress.zip} onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl" />
              <input type="text" placeholder="Country" value={shippingAddress.country} onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})} className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl" />
            </div>
          </div>

          <div className="md:col-span-2 border-t border-[#1f2233] pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-slate-400">Shipping Options & Insurance</h3>
              <button 
                type="button" 
                onClick={fetchRates} 
                disabled={isFetchingRates} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-colors flex items-center space-x-2"
              >
                {isFetchingRates ? (
                  <span>Calculating...</span>
                ) : (
                  <span>Get Live Rates</span>
                )}
              </button>
            </div>
            
            {shippingError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm mb-4">
                {shippingError}
              </div>
            )}
            
            {shippoRates.length > 0 ? (
              <div className="space-y-3 mb-6">
                {shippoRates.map((rate) => (
                  <label key={rate.objectId} className={`flex items-center space-x-3 p-3 bg-[#0a0c13] rounded-xl border cursor-pointer transition-colors ${selectedShippingRate === rate.objectId ? 'border-emerald-500' : 'border-[#1f2233] hover:border-emerald-500/50'}`}>
                    <input 
                      type="radio" 
                      name="shippingRate" 
                      value={rate.objectId} 
                      checked={selectedShippingRate === rate.objectId} 
                      onChange={(e) => setSelectedShippingRate(e.target.value)} 
                      className="text-emerald-500 focus:ring-emerald-500/20 bg-[#11141d]" 
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">{rate.title || rate.provider}</div>
                      <div className="text-sm text-slate-400">{rate.estimatedDays ? `${rate.estimatedDays} days` : 'Standard delivery'}</div>
                    </div>
                    <div className="text-emerald-400 font-medium">${parseFloat(rate.amount).toFixed(2)}</div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic mb-6">
                Click "Get Live Rates" to calculate shipping costs.
              </div>
            )}

            <div className="mt-4">
              <label className="flex items-center space-x-3 p-3 bg-[#0a0c13] rounded-xl border border-[#1f2233] cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={addInsurance} 
                  onChange={(e) => setAddInsurance(e.target.checked)} 
                  className="text-emerald-500 focus:ring-emerald-500/20 bg-[#11141d] rounded" 
                />
                <div className="flex-1">
                  <div className="text-white font-medium">Add Shipping Insurance</div>
                  <div className="text-sm text-slate-400">Protect order during shipping (1.25% of subtotal + shipping)</div>
                </div>
                <div className="text-emerald-400 font-medium">
                  + ${calculateInsuranceCost().toFixed(2)}
                </div>
              </label>
            </div>
            
          </div>

        </div>

        <div className="flex justify-between items-center pt-6 mt-6 border-t border-[#1f2233]">
          <div className="text-white font-medium">
            <span className="text-slate-400 mr-2">Total Order Value:</span>
            <span className="text-xl text-emerald-400 font-medium">
              ${(
                (calculateCurrentItem().itemPrice * Number(formData.quantity)) +
                getSelectedShippingCost() +
                calculateInsuranceCost()
              ).toFixed(2)}
            </span>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="px-6 py-2.5 bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminAddOrderPage;
