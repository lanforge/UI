import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faCheck, faEnvelope, faTruckFast, faCheckCircle, faWrench, faChartBar, faHouse, faXmark, faCalendar, faHeart, faMobileScreen, faPhone } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../App.css';

type OrderStatus = 
  | 'Order Confirmed'
  | 'Building'
  | 'Benchmarking'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Returned'
  | 'Cancelled';

const OrderStatusPage: React.FC = () => {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('Order Confirmed');
  const [orderId, setOrderId] = useState('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const statusLevels: OrderStatus[] = [
    'Order Confirmed',
    'Building',
    'Benchmarking',
    'Shipped',
    'Out for Delivery',
    'Delivered'
  ];

  const specialStatuses: OrderStatus[] = ['Returned', 'Cancelled'];

  const getStatusIndex = (status: OrderStatus): number => {
    return statusLevels.indexOf(status);
  };

  const isSpecialStatus = (status: OrderStatus): boolean => {
    return specialStatuses.includes(status);
  };

  const getProgressPercentage = (): number => {
    if (isSpecialStatus(orderStatus)) {
      return 100;
    }
    const currentIndex = getStatusIndex(orderStatus);
    return ((currentIndex + 1) / statusLevels.length) * 100;
  };

  const getStatusColor = (status: OrderStatus): string => {
    if (status === 'Cancelled') return '#ff4757';
    if (status === 'Returned') return '#ffc107';
    return '#00ff9d';
  };

  const getStatusDescription = (status: OrderStatus): string => {
    const descriptions: Record<OrderStatus, string> = {
      'Order Confirmed': 'Your order has been confirmed and is being prepared for production.',
      'Building': 'Our technicians are assembling your custom gaming PC with premium components.',
      'Benchmarking': 'Your system is undergoing rigorous performance testing and quality assurance.',
      'Shipped': 'Your order has been packaged and shipped with tracking information.',
      'Out for Delivery': 'Your package is on the delivery vehicle and will arrive soon.',
      'Delivered': 'Your order has been successfully delivered to your address.',
      'Returned': 'This order has been returned to our facility.',
      'Cancelled': 'This order has been cancelled.'
    };
    return descriptions[status];
  };

  const getStatusIcon = (status: OrderStatus): React.ReactNode => {
    const icons: Record<OrderStatus, React.ReactNode> = {
      'Order Confirmed': <FontAwesomeIcon icon={faCheckCircle} />,
      'Building': <FontAwesomeIcon icon={faWrench} />,
      'Benchmarking': <FontAwesomeIcon icon={faChartBar} />,
      'Shipped': <FontAwesomeIcon icon={faTruckFast} />,
      'Out for Delivery': <FontAwesomeIcon icon={faBox} />,
      'Delivered': <FontAwesomeIcon icon={faHouse} />,
      'Returned': '↩️',
      'Cancelled': <FontAwesomeIcon icon={faXmark} />
    };
    return icons[status] as React.ReactNode;
  };

  const getEstimatedTime = (status: OrderStatus): string => {
    const times: Record<OrderStatus, string> = {
      'Order Confirmed': '1-2 business days',
      'Building': '3-5 business days',
      'Benchmarking': '1-2 business days',
      'Shipped': '5-7 business days',
      'Out for Delivery': 'Same day',
      'Delivered': 'Completed',
      'Returned': 'Processing',
      'Cancelled': 'Completed'
    };
    return times[status];
  };

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingInsurance, setShippingInsurance] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [taxCost, setTaxCost] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [activeDonationCauses, setActiveDonationCauses] = useState<any[]>([]);

  const fetchOrder = (id: string) => {
    fetch(`${process.env.REACT_APP_API_URL}/orders/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then(data => {
        if (data.order) {
          setOrderId(data.order.orderNumber || data.order._id);
          const mapped = data.order.items.map((item: any) => ({
            id: item.product || Math.random(),
            name: item.name || item.product?.name || 'Unknown Item',
            price: item.price,
            quantity: item.quantity
          }));
          setOrderItems(mapped);
          setShippingCost(data.order.shipping || data.order.shippingCost || 0);
          setShippingInsurance(data.order.shippingInsurance || 0);
          setTaxCost(data.order.tax || 0);
          setDiscountAmount(data.order.discount || 0);
          setTotalCost(data.order.total || 0);
          setCustomerInfo({
             firstName: data.order.customer?.firstName || 'Customer',
             lastName: data.order.customer?.lastName || '',
             email: data.order.customer?.email || data.order.email || '',
             phone: data.order.customer?.phone || data.order.phone || '',
             address: data.order.shippingAddress || {}
          });
          
          const backendStatus = data.order.status;
          const statusMap: Record<string, OrderStatus> = {
            'order-confirmed': 'Order Confirmed',
            'building': 'Building',
            'benchmarking': 'Benchmarking',
            'shipped': 'Shipped',
            'out-for-delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'returned': 'Returned',
            'cancelled': 'Cancelled'
          };
          if (statusMap[backendStatus]) {
            setOrderStatus(statusMap[backendStatus]);
          }

          const orderDate = new Date(data.order.createdAt || Date.now());
          fetch(`${process.env.REACT_APP_API_URL}/donation-causes`)
            .then(res => res.json())
            .then(causes => {
              if (Array.isArray(causes)) {
                const activeForOrder = causes.filter(cause => {
                  const causeCreated = new Date(cause.createdAt);
                  const causeEnd = cause.endDate ? new Date(cause.endDate) : null;
                  return causeCreated <= orderDate && (!causeEnd || causeEnd >= orderDate);
                });
                setActiveDonationCauses(activeForOrder);
              }
            })
            .catch(err => console.error('Error fetching donation causes:', err));
        } else {
          setErrorMsg('Order not found.');
        }
      })
      .catch(err => {
        console.error(err);
        setErrorMsg('We could not find an order with that ID.');
      });
  };

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) {
      setErrorMsg('No order ID provided in the link.');
      return;
    }
    
    fetchOrder(id);

    // Auto update order status from backend via Server-Sent Events to catch admin changes
    let eventSource: EventSource | null = null;
    
    const sseTimeout = setTimeout(() => {
      // Connect to the stream using either the Mongo ID or orderNumber
      // To ensure it matches how it's sent from the backend, we use the raw ID from URL which could be either
      eventSource = new EventSource(`${process.env.REACT_APP_API_URL}/orders/stream/${id}`);
      
      eventSource.addEventListener('order_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'update') {
            fetchOrder(id);
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
    }, 100);

    return () => {
      clearTimeout(sseTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // To prevent TS unused-vars or anything if it complains, I am replacing the original fetch with fetchOrder inside useEffect.
  // Wait, I need to make sure I remove the old fetch exactly as it was. Let's fix the SEARCH block.

  const calculateTotal = () => {
    if (totalCost > 0) return totalCost;
    // We don't have access to the raw data discount in calculateTotal if it wasn't saved in state. Let's make sure it's accurate.
    // If totalCost is 0, we'll just sum what we know.
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0) + taxCost + shippingCost + shippingInsurance - discountAmount;
  };

  if (errorMsg) {
    return (
      <div className="order-status-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <FontAwesomeIcon icon={faBox} style={{ fontSize: '4rem', color: 'rgba(255, 255, 255, 0.2)', marginBottom: '1rem' }} />
          <h2>Order Not Found</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>{errorMsg}</p>
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FontAwesomeIcon icon={faHouse} /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-status-page">
      <div className="container">
        <motion.div 
          className="order-status-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '0.5rem' }}>
            <div style={{ position: 'absolute', left: 'calc(50% - 50vw + 2rem)' }}>
              <Link to="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FontAwesomeIcon icon={faHouse} /> Home
              </Link>
            </div>
            <h1 style={{ margin: 0, textAlign: 'center' }}>Order Status</h1>
          </div>
          <p className="order-subtitle">Track your order in real-time</p>
          <div className="order-id-display">
            <span className="order-id-label">Order ID:</span>
            <span className="order-id-value">{orderId}</span>
          </div>
        </motion.div>

        <div className="order-status-layout">
          <motion.div 
            className="order-status-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="status-header">
              <h2>Order Progress</h2>
              <div className="status-badge" style={{ backgroundColor: getStatusColor(orderStatus) }}>
                {orderStatus}
              </div>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getStatusColor(orderStatus)
                  }}
                />
              </div>
              
              {!isSpecialStatus(orderStatus) ? (
                <div className="status-levels">
                  {statusLevels.map((level, index) => {
                    const isCompleted = index <= getStatusIndex(orderStatus);
                    const isCurrent = level === orderStatus;
                    
                    return (
                      <div key={level} className="status-level">
                        <div 
                          className={`level-indicator ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                          style={{ 
                            backgroundColor: isCompleted ? getStatusColor(orderStatus) : 'rgba(255, 255, 255, 0.1)',
                            borderColor: isCurrent ? getStatusColor(orderStatus) : 'rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          {isCompleted ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
                        </div>
                        <div className="level-info">
                          <span className="level-title">{level}</span>
                          <span className="level-time">{getEstimatedTime(level)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="special-status">
                  <div className="special-status-icon">{getStatusIcon(orderStatus)}</div>
                  <div className="special-status-info">
                    <h3>{orderStatus}</h3>
                    <p>{getStatusDescription(orderStatus)}</p>
                  </div>
                </div>
              )}

              <div className="current-status-details">
                <div className="status-icon">{getStatusIcon(orderStatus)}</div>
                <div className="status-details">
                  <h3>Current Status: {orderStatus}</h3>
                  <p>{getStatusDescription(orderStatus)}</p>
                  <div className="status-meta">
                    <span className="meta-item text-xs text-gray-400">Note: Times are an estimate and are not guaranteed</span>
                  </div>
                </div>
              </div>
              
              {['Shipped', 'Out for Delivery', 'Delivered'].includes(orderStatus) && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <Link to={`/track/${orderId}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                    <FontAwesomeIcon icon={faTruckFast} /> Track Shipment
                  </Link>
                </div>
              )}
            </div>

          </motion.div>

          <motion.div 
            className="order-summary-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2>Order Summary</h2>
            
            <div className="order-items-list">
              {orderItems.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                  </div>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${orderItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              {shippingCost > 0 && (
                <div className="total-row">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
              )}
              {shippingInsurance > 0 && (
                <div className="total-row">
                  <span>Shipping Insurance</span>
                  <span>${shippingInsurance.toFixed(2)}</span>
                </div>
              )}
              {taxCost > 0 && (
                <div className="total-row">
                  <span>Tax</span>
                  <span>${taxCost.toFixed(2)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="total-row" style={{ color: '#00ff9d' }}>
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {activeDonationCauses.length > 0 && (
              <div className="donation-info" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(0, 255, 157, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 255, 157, 0.2)' }}>
                <h3 style={{ color: '#00ff9d', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span><FontAwesomeIcon icon={faHeart} /></span> Impact with Your Order
                </h3>
                {activeDonationCauses.map(cause => (
                  <div key={cause._id} className="donation-cause" style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>{cause.name}</h4>
                    {cause.description && <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>{cause.description}</p>}
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#00ff9d' }}>
                      A portion of this order's proceeds supports this cause.
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="shipping-info">
              <h3>Shipping Information</h3>
              <div className="shipping-details">
                {customerInfo ? (
                  <>
                    <p><strong>{customerInfo.firstName} {customerInfo.lastName}</strong></p>
                    {customerInfo.address && (
                      <>
                        <p>{customerInfo.address.address}</p>
                        <p>{customerInfo.address.city}, {customerInfo.address.state} {customerInfo.address.zip}</p>
                        <p>{customerInfo.address.country || 'United States'}</p>
                      </>
                    )}
                    <p><FontAwesomeIcon icon={faEnvelope} /> {customerInfo.email}</p>
                    {customerInfo.phone && <p><FontAwesomeIcon icon={faMobileScreen} /> {customerInfo.phone}</p>}
                  </>
                ) : (
                  <p>Loading shipping info...</p>
                )}
              </div>
            </div>

            <div className="support-info">
              <h3>Need Help?</h3>
              <div className="support-options">
                <div className="support-option">
                  <span className="option-icon">💬</span>
                  <div>
                    <h4>Live Chat</h4>
                    <p>Available 24/7</p>
                  </div>
                </div>
                <div className="support-option">
                  <span className="option-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                  <div>
                    <h4>Email</h4>
                    <p>support@lanforge.co</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="navigation-actions">
              <Link to="/" className="btn btn-secondary">Continue Shopping</Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default OrderStatusPage;