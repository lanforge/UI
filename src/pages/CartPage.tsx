import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faCreditCard, faBuilding, faMobile, faLock, faTruck, faShieldAlt, faUndo } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  image: string;
  category: string;
  rawItem: any; // Keep the original reference to pass back to API
  fee?: number;
  notes?: string;
}

// Pull a usable ObjectId string out of a cart item ref, whether the server
// returned the populated doc or just the raw id (or null, after a populate miss).
const refId = (ref: any): string | null => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object' && ref._id) return String(ref._id);
  return null;
};

// Map one server cart item -> our local CartItem. Type-aware so the
// optimization/merch/accessory/pc-part branches each pull the right fields
// (image vs images[0], etc.), and falls back to the locally-loaded
// `optimizations` list when populate didn't bring back the doc.
const mapCartItem = (item: any, index: number, optimizationsList: any[]): CartItem => {
  const customBuild = item.customBuild;
  if (customBuild && typeof customBuild === 'object') {
    let buildImage = '/logo-2.png';
    if (Array.isArray(customBuild.parts) && customBuild.parts.length > 0) {
      const casePart = customBuild.parts.find((p: any) =>
        p.partType === 'case' || p.partType === 'Case' || (p.part && (p.part.type === 'Case' || p.part.type === 'case'))
      );
      if (casePart?.part?.images?.[0]) buildImage = casePart.part.images[0];
    }
    return {
      id: customBuild._id || index.toString(),
      name: customBuild.name || 'Custom Build',
      description: `Custom PC Build (${customBuild.parts?.length || 0} parts)`,
      price: customBuild.total || 0,
      quantity: item.quantity || 1,
      image: buildImage,
      category: 'Custom PC',
      rawItem: { customBuild: customBuild._id || customBuild },
      fee: customBuild.laborFee || 0,
    };
  }

  // Optimization
  const optimizationId = refId(item.optimization);
  if (optimizationId) {
    const populated = typeof item.optimization === 'object' && item.optimization?.name ? item.optimization : null;
    const fallback = populated ? null : optimizationsList.find(o => String(o._id) === optimizationId);
    const source = populated || fallback;
    return {
      id: optimizationId,
      name: source?.name || 'Optimization',
      description: source?.shortDescription || 'Optimization',
      price: Number(source?.price) || 0,
      compareAtPrice: source?.compareAtPrice,
      quantity: item.quantity || 1,
      image: source?.image || '/logo-2.png',
      category: 'Optimization',
      notes: item.notes,
      rawItem: { optimization: optimizationId, notes: item.notes },
    };
  }

  // Product / pcPart / accessory / merch — all reuse the populated doc.
  const product = item.product || item.pcPart || item.accessory || item.merch;
  let itemCategory = 'Component';
  let fallbackName = 'Item';
  if (item.product) {
    itemCategory = product?.subcategory || product?.category || product?.type || 'PC';
    fallbackName = 'Product';
  } else if (item.accessory) {
    itemCategory = product?.category || 'Accessory';
    fallbackName = 'Accessory';
  } else if (item.merch) {
    itemCategory = 'Merch';
    fallbackName = 'Merch';
  } else if (item.pcPart) {
    itemCategory = product?.type || 'Component';
    fallbackName = 'Part';
  }

  const variantSuffix = [item.size, item.color].filter(Boolean).join(' / ');

  return {
    id: product?._id || index.toString(),
    name: product?.name || fallbackName,
    description: variantSuffix
      ? `${itemCategory} — ${variantSuffix}`
      : product?.brand ? `${product.brand} - ${product.type || itemCategory}` : itemCategory,
    price: Number(item.price) || Number(product?.price) || 0,
    compareAtPrice: product?.compareAtPrice,
    quantity: item.quantity || 1,
    image: product?.images?.[0] || '/logo-2.png',
    category: itemCategory,
    notes: item.notes,
    rawItem: {
      product: refId(item.product),
      pcPart: refId(item.pcPart),
      accessory: refId(item.accessory),
      merch: refId(item.merch),
      size: item.size,
      color: item.color,
      notes: item.notes,
    },
  };
};

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [storeSettings, setStoreSettings] = useState<{ taxRate: number, taxEnabled: boolean }>({ taxRate: 8, taxEnabled: true });
  const [optimizations, setOptimizations] = useState<any[]>([]);
  // Keep a ref so SSE-driven fetchCart callbacks always see the latest list.
  const optimizationsRef = useRef<any[]>([]);

  const fetchCart = () => {
    let sessionId = localStorage.getItem('cartSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cartSessionId', sessionId);
    }

    fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.cart && data.cart.items) {
          const mapped = data.cart.items.map((item: any, index: number) =>
            mapCartItem(item, index, optimizationsRef.current)
          );
          setCartItems(mapped);
          setCustomDiscount(data.cart.customDiscountAmount || 0);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchSettings = () => {
    fetch(`${process.env.REACT_APP_API_URL}/settings/public`)
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setStoreSettings({
            taxRate: data.settings.taxRate !== undefined && data.settings.taxRate !== null ? data.settings.taxRate : 8.0,
            taxEnabled: data.settings.taxEnabled !== false
          });
        }
      })
      .catch(err => console.error(err));
  };

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/optimizations`)
      .then(res => res.json())
      .then(data => {
        const list = data.optimizations || [];
        optimizationsRef.current = list;
        setOptimizations(list);
        // If the cart already rendered before the optimization list arrived,
        // re-fetch so any "Optimization · $0" rows fill in correctly.
        fetchCart();
      })
      .catch(err => console.error('Failed to load optimizations', err));
  }, []);

  React.useEffect(() => {
    fetchCart();
    fetchSettings();
    
    // Auto update cart from backend via Server-Sent Events to catch admin changes
    // Add timeout to ensure fetchCart has completed storing the sessionId
    const sseTimeout = setTimeout(() => {
      const sessionId = localStorage.getItem('cartSessionId');
      
      if (sessionId) {
        eventSource = new EventSource(`${process.env.REACT_APP_API_URL}/carts/stream/${sessionId}`);
        
        eventSource.addEventListener('cart_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'update') {
              fetchCart();
              fetchSettings();
            }
          } catch (e) {
            console.error('Error parsing SSE data', e);
          }
        });

        eventSource.onerror = (error) => {
          console.error('SSE Error', error);
          if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            eventSource.close();
          }
        };
      }
    }, 100);

    let eventSource: EventSource | null = null;

    return () => {
      clearTimeout(sseTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const syncCartWithApi = (items: CartItem[], options: { clearDiscount?: boolean } = {}) => {
    const sessionId = localStorage.getItem('cartSessionId');
    if (!sessionId) return;
    
    // Group identical items
    const mergedItemsMap = new Map<string, any>();
    items.forEach(i => {
      const baseKey = i.rawItem.customBuild || i.rawItem.product || i.rawItem.pcPart || i.rawItem.accessory || i.rawItem.merch || i.rawItem.optimization;
      const key = `${baseKey}-${i.rawItem.size || ''}-${i.rawItem.color || ''}-${i.notes || ''}`;
      if (mergedItemsMap.has(key)) {
        mergedItemsMap.get(key).quantity += i.quantity;
      } else {
        mergedItemsMap.set(key, { ...i.rawItem, quantity: i.quantity });
      }
    });

    const mappedItems = Array.from(mergedItemsMap.values());
    
    fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: mappedItems, clearDiscount: options.clearDiscount })
    }).catch(err => console.error(err));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
    } else {
      const updated = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updated);
      syncCartWithApi(updated);
    }
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    syncCartWithApi(updated);
  };

  const clearAll = () => {
    setCartItems([]);
    setCustomDiscount(0);
    syncCartWithApi([], { clearDiscount: true });
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotalFee = () => {
    return cartItems.reduce((total, item) => total + ((item.fee || 0) * item.quantity), 0);
  };

  const calculateTax = () => {
    if (!storeSettings.taxEnabled) return 0;
    return Math.max(0, calculateSubtotal() - customDiscount) * (storeSettings.taxRate / 100);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - customDiscount);
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  return (
    <div className="cart-page">
      <div className="container-narrow">
        <motion.div 
          className="cart-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1>Your Shopping Cart</h1>
          <p className="cart-subtitle">Review your items and proceed to checkout</p>
        </motion.div>

        <div className="cart-layout">
          <motion.div 
            className="cart-items"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-4xl" />
                </div>
                <h2>Your cart is empty</h2>
                <p>Add some awesome PC components to get started!</p>
                <Link to="/configurator" className="btn btn-primary">
                  Start Building Your PC
                </Link>
              </div>
            ) : (
              <>
                <div className="cart-items-header">
                  <h2>Items ({cartItems.length})</h2>
                  <button 
                    className="btn btn-text"
                    onClick={clearAll}
                  >
                    Clear All
                  </button>
                </div>
                
                {cartItems.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    className="cart-item"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                  >
                    <div className="cart-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        <h3>{item.name}</h3>
                        <span className="cart-item-category">{item.category}</span>
                      </div>
                      <p className="cart-item-description">{item.description}</p>
                      {item.notes && (
                        <p className="text-sm text-emerald-400 mt-1 mb-2 font-medium">
                          {item.notes}
                        </p>
                      )}
                      {item.fee !== undefined && item.fee > 0 && (
                        <p className="text-sm text-emerald-400 mt-1 mb-2 font-medium">
                          Includes ${item.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} System Integration & Validation fee
                        </p>
                      )}
                      <div className="cart-item-actions">
                        <div className="quantity-selector">
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button 
                          className="btn btn-text btn-danger"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-price">
                      <div className="flex items-baseline justify-end gap-2">
                        <div className="price-amount">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <div className="text-sm text-gray-500 line-through">
                            ${(item.compareAtPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                      <div className="price-unit">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <span className="text-gray-500 line-through ml-1">
                            ${item.compareAtPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {(() => {
                  const hasPC = cartItems.some(ci => ci.category === 'Custom PC' || ci.category === 'PC' || ci.rawItem?.product || ci.rawItem?.customBuild);
                  const cartOptimizationIds = new Set(
                    cartItems
                      .map(ci => ci.rawItem?.optimization)
                      .filter(Boolean)
                  );
                  const available = optimizations.filter(o => !cartOptimizationIds.has(o._id));
                  if (!hasPC || available.length === 0) return null;

                  const addOptimization = (opt: any) => {
                    const newItem: CartItem = {
                      id: opt._id,
                      name: opt.name,
                      description: opt.shortDescription || 'Optimization',
                      price: opt.price,
                      quantity: 1,
                      image: opt.image || '/logo-2.png',
                      category: 'Optimization',
                      rawItem: { optimization: opt._id },
                    };
                    const updated = [...cartItems, newItem];
                    setCartItems(updated);
                    syncCartWithApi(updated);
                  };

                  return (
                    <motion.div
                      className="cart-upsell mt-6 p-5 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] to-transparent"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.15 + (cartItems.length * 0.05) }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-white">Optimize your PC</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Bolt-on services to dial in your build</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold">Add-on</span>
                      </div>

                      <div className="divide-y divide-white/5">
                        {available.map((opt, idx) => (
                          <motion.div
                            key={opt._id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: idx * 0.04 }}
                            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{opt.name}</p>
                              {opt.shortDescription && (
                                <p className="text-xs text-gray-400 mt-0.5">{opt.shortDescription}</p>
                              )}
                            </div>
                            <div className="flex items-baseline gap-2 whitespace-nowrap">
                              <span className="text-sm text-emerald-400 font-semibold">
                                +${opt.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {opt.compareAtPrice && opt.compareAtPrice > opt.price && (
                                <span className="text-xs text-gray-500 line-through">
                                  ${opt.compareAtPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => addOptimization(opt)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400 transition-colors whitespace-nowrap"
                            >
                              Add
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })()}
              </>
            )}
          </motion.div>

          <motion.div 
            className="cart-summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2>Order Summary</h2>
            
            <div className="summary-details space-y-3 mb-6">
              <div className="flex justify-between items-center text-gray-400">
                <span>Items Subtotal</span>
                <span>${(calculateSubtotal() - calculateTotalFee()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {calculateTotalFee() > 0 && (
                <div className="flex justify-between items-center text-gray-400">
                  <span>Build Services</span>
                  <span>${calculateTotalFee().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {customDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Discount</span>
                  <span>-${customDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-center text-xl font-bold text-white mb-1">
                <span>Total</span>
                <span>${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {calculateTotal() > 0 && (
                <div className="flex justify-end items-center flex-wrap text-xs gap-1">
                  <span className="text-gray-400">or</span> <span className="text-blue-400 font-medium">${Math.ceil((calculateTotal() * 1.0999) / 24)}/mo</span> <span className="text-gray-400">with</span> <img src="https://cdn-assets.affirm.com/images/white_logo-transparent_bg.png" alt="Affirm" className="h-[12px] inline-block -mt-0.5 translate-y-[1px]" />
                </div>
              )}
            </div>

            <div className="summary-actions">
              {cartItems.length > 0 && (
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </button>
              )}
              
              <Link to="/configurator" className="btn btn-secondary">
                Continue Shopping
              </Link>
              
              <div className="payment-methods">
                <p>Secure payment with:</p>
                <div className="payment-icons">
                  <span><FontAwesomeIcon icon={faCreditCard} /></span>
                  <span><FontAwesomeIcon icon={faBuilding} /></span>
                  <span><FontAwesomeIcon icon={faMobile} /></span>
                  <span><FontAwesomeIcon icon={faLock} /></span>
                </div>
              </div>
            </div>

            <div className="summary-features">
              <div className="feature">
                <span className="feature-icon"><FontAwesomeIcon icon={faTruck} /></span>
                <div>
                  <h4>Free Shipping</h4>
                  <p>On orders over $2000</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon"><FontAwesomeIcon icon={faShieldAlt} /></span>
                <div>
                  <h4>3-Year Warranty</h4>
                  <p>All systems include warranty</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon"><FontAwesomeIcon icon={faUndo} /></span>
                <div>
                  <h4>14-Day Returns</h4>
                  <p>Hassle-free returns</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;