import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faTruckFast, faCheckCircle, faHouse, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import '../App.css';

const ShipmentTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No order ID provided.');
      setLoading(false);
      return;
    }

    const fetchTracking = async () => {
      try {
        // Fetch order to get tracking details
        const orderRes = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`);
        if (!orderRes.ok) throw new Error('Order not found');
        const orderJson = await orderRes.json();
        const order = orderJson.order;
        setOrderData(order);

        if (!order.trackingNumber) {
          setErrorMsg('No tracking information available for this order yet.');
          setLoading(false);
          return;
        }

        let carrier = order.carrier ? order.carrier.toLowerCase() : 'ups';
        if (carrier === 'unknown' || carrier === '') {
          carrier = 'ups';
        }
        
        // Fetch tracking info from our backend
        const trackRes = await fetch(`${process.env.REACT_APP_API_URL}/shipping/track/${carrier}/${order.trackingNumber}`);
        if (!trackRes.ok) {
          const errorText = await trackRes.text();
          throw new Error(errorText || 'Failed to fetch tracking data');
        }
        
        const trackJson = await trackRes.json();
        setTrackingData(trackJson.trackingInfo);
      } catch (err: any) {
        console.error('Tracking error:', err);
        setErrorMsg(err.message || 'We could not fetch tracking information at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [orderId]);

  if (loading) {
    return (
      <div className="order-status-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '3rem', color: '#00ff9d', marginBottom: '1rem' }} />
          <h2 style={{ color: 'white' }}>Loading Tracking Info...</h2>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="order-status-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: '4rem', color: '#ffc107', marginBottom: '1rem' }} />
          <h2>Tracking Unavailable</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>{errorMsg}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <FontAwesomeIcon icon={faHouse} /> Return Home
            </Link>
            {orderId && (
              <Link to={`/order-status?id=${orderId}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <FontAwesomeIcon icon={faBox} /> Back to Order
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const trackingHistory = trackingData?.trackingHistory || trackingData?.tracking_history || [];
  const trackingStatus = trackingData?.trackingStatus || trackingData?.tracking_status || {};
  const currentStatus = trackingStatus.status || 'UNKNOWN';

  return (
    <div className="order-status-page" style={{ minHeight: '100vh', padding: '4rem 0' }}>
      <div className="container">
        <motion.div 
          className="order-status-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '1rem' }}>
            <div style={{ position: 'absolute', left: 'calc(50% - 50vw + 2rem)' }}>
              <Link to={`/order-status?id=${orderId}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FontAwesomeIcon icon={faBox} /> Order Status
              </Link>
            </div>
            <h1 style={{ margin: 0, textAlign: 'center' }}>Shipment Tracking</h1>
          </div>
          
          <div className="order-id-display" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="order-id-label" style={{ marginRight: '0.5rem' }}>Tracking Number:</span>
              {(() => {
                const carrierName = trackingData?.carrier || orderData?.carrier || 'ups';
                const trackingNum = trackingData?.trackingNumber || trackingData?.tracking_number || orderData?.trackingNumber;
                
                if (carrierName.toLowerCase() === 'ups') {
                  return (
                    <a 
                      href={`https://www.ups.com/track?tracknum=${trackingNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 1rem', fontSize: '1.1rem' }}
                    >
                      {trackingNum} <FontAwesomeIcon icon={faBox} style={{ marginLeft: '0.25rem' }} />
                    </a>
                  );
                }
                
                return (
                  <span className="order-id-value" style={{ color: '#00ff9d', fontSize: '1.2rem' }}>{trackingNum}</span>
                );
              })()}
            </div>
            {(trackingData?.carrier || orderData?.carrier || true) && (
              <div>
                <span className="order-id-label">Carrier:</span>
                <span className="order-id-value" style={{ textTransform: 'uppercase' }}>
                  {trackingData?.carrier || orderData?.carrier || 'UPS'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="order-status-layout" style={{ maxWidth: '800px', margin: '0 auto', gridTemplateColumns: '1fr' }}>
          <motion.div 
            className="order-status-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="status-header">
              <h2>Current Status</h2>
              <div className="status-badge" style={{ 
                backgroundColor: currentStatus === 'DELIVERED' ? '#00ff9d' : '#3b82f6',
                color: currentStatus === 'DELIVERED' ? '#000' : '#fff'
              }}>
                {trackingStatus.statusDetails || trackingStatus.status_details || currentStatus}
              </div>
            </div>

            {(trackingStatus.statusDate || trackingStatus.status_date) && (
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: '1rem 0' }}>
                Last Updated: {new Date(trackingStatus.statusDate || trackingStatus.status_date).toLocaleString()}
              </p>
            )}
            
            {trackingStatus.location && (trackingStatus.location.city || trackingStatus.location.state) && (
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 2rem 0' }}>
                Location: {trackingStatus.location.city}{trackingStatus.location.city && trackingStatus.location.state ? ', ' : ''}{trackingStatus.location.state}
              </p>
            )}

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Tracking History</h3>
              {trackingHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {[...trackingHistory].reverse().map((event: any, index: number) => (
                    <div key={index} style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        backgroundColor: index === 0 ? '#00ff9d' : 'rgba(255,255,255,0.2)',
                        marginTop: '6px',
                        flexShrink: 0
                      }} />
                      <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: index === 0 ? 'white' : 'rgba(255,255,255,0.8)' }}>
                          {event.statusDetails || event.status_details || event.status}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(event.statusDate || event.status_date).toLocaleString()}
                        </p>
                        {event.location && (event.location.city || event.location.state) && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                            {event.location.city}{event.location.city && event.location.state ? ', ' : ''}{event.location.state} {event.location.zip}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No tracking history available yet.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentTrackingPage;
