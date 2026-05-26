import React, { useState } from 'react';
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
  quantity: number;
  image: string;
  category: string;
  rawItem: any; // Keep the original reference to pass back to API
  fee?: number;
  notes?: string;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [storeSettings, setStoreSettings] = useState<{ taxRate: number, taxEnabled: boolean }>({ taxRate: 8, taxEnabled: true });

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
          const mapped = data.cart.items.map((item: any, index: number) => {
            const product = item.product || item.pcPart || item.accessory;
            const customBuild = item.customBuild;
            
            if (customBuild) {
              let buildImage = '/logo-2.png';
              
              if (customBuild.parts && customBuild.parts.length > 0) {
                // Find the case part to use as the image
                const casePart = customBuild.parts.find((p: any) => 
                  p.partType === 'case' || p.partType === 'Case' || (p.part && (p.part.type === 'Case' || p.part.type === 'case'))
                );
                
                if (casePart && casePart.part && casePart.part.images && casePart.part.images.length > 0) {
                  buildImage = casePart.part.images[0];
                }
              }

              // Deduplicate logic locally in case cart API returns raw parts vs merged. Wait, Cart handles it.
              return {
                id: customBuild._id || index.toString(),
                name: customBuild.name || 'Custom Build',
                description: `Custom PC Build (${customBuild.parts?.length || 0} parts)`,
                price: customBuild.total || 0,
                quantity: item.quantity || 1,
                image: buildImage,
                category: 'Custom PC',
                rawItem: { customBuild: customBuild._id || customBuild },
                fee: customBuild.laborFee || 0
              };
            }
            
            // Determine category
            let itemCategory = 'Component';
            if (item.product) {
              itemCategory = product?.subcategory || product?.category || product?.type || 'PC';
            } else if (item.accessory) {
              itemCategory = product?.category || 'Accessory';
            } else if (item.pcPart) {
              itemCategory = product?.type || 'Component';
            }

            return {
              id: product?._id || index.toString(),
              name: product?.name || 'Item',
              description: product?.brand ? `${product.brand} - ${product.type || itemCategory}` : itemCategory,
              price: item.price || product?.price || 0,
              quantity: item.quantity || 1,
              image: product?.images?.[0] || '/logo-2.png',
              category: itemCategory,
              notes: item.notes,
              rawItem: { 
                product: item.product?._id || item.product,
                pcPart: item.pcPart?._id || item.pcPart,
                accessory: item.accessory?._id || item.accessory,
                notes: item.notes,
              }
            };
          });
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
      const baseKey = i.rawItem.customBuild || i.rawItem.product || i.rawItem.pcPart || i.rawItem.accessory;
      const key = `${baseKey}-${i.notes || ''}`;
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
                      <div className="price-amount">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="price-unit">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</div>
                    </div>
                  </motion.div>
                ))}
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