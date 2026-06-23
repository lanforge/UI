import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
// @ts-ignore
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import MapboxAddressAutocomplete, { MapboxAddressResult } from '../components/MapboxAddressAutocomplete';
import '../App.css';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<string>('');
  
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [donationOption, setDonationOption] = useState<'none' | 'roundup' | 'fixed' | 'custom'>('none');
  const [customDonation, setCustomDonation] = useState('');
  const [shippingInsurance, setShippingInsurance] = useState(true);
  
  const [shippoRates, setShippoRates] = useState<any[]>([]);
  const [shippingMethod, setShippingMethod] = useState<string>('standard');
  const [shippingMethodCost, setShippingMethodCost] = useState<number>(49.99);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  
  const [discountCode, setDiscountCode] = useState(() => localStorage.getItem('autoDiscountCode') || '');
  const [promoInput, setPromoInput] = useState('');
  const [customDiscountAmount, setCustomDiscountAmount] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; balance: number; currency: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const applyDiscountCode = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal: calculateSubtotal() })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount(data.discount);
        setDiscountCode(code);
        return true;
      }
    } catch {}
    return false;
  };

  const applyGiftCardCode = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/giftcards/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedGiftCard({ code: data.code, balance: data.balance, currency: data.currency || 'USD' });
        return true;
      }
    } catch {}
    return false;
  };

  const handleApplyPromo = async (codeOverride?: string) => {
    const code = (codeOverride ?? promoInput).trim().toUpperCase();
    setPromoError('');
    if (!code) return;
    setIsApplyingPromo(true);
    try {
      // Try discount first, then gift card
      if (await applyDiscountCode(code)) {
        setPromoInput('');
        return;
      }
      if (await applyGiftCardCode(code)) {
        setPromoInput('');
        return;
      }
      setPromoError('Invalid discount or gift card code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Keep legacy handler name in sync for the auto-apply effect below
  const handleApplyDiscount = () => handleApplyPromo(discountCode);
  
  const [activeCauses, setActiveCauses] = useState<any[]>([]);
  const [selectedCauseId, setSelectedCauseId] = useState<string>('');

  const handleShippingAddressSelect = (place: MapboxAddressResult) => {
    setShippingForm((prev) => ({
      ...prev,
      address: place.address || prev.address,
      city: place.city || prev.city,
      state: place.state || prev.state,
      zip: place.zip || prev.zip,
      country: place.country || prev.country,
    }));
  };

  const [storeSettings, setStoreSettings] = useState<{ taxRate: number, taxEnabled: boolean }>({ taxRate: 8, taxEnabled: true });

  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const [billingForm, setBillingForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  // ── Phone helpers ──────────────────────────────────────────────────────────
  // - If input starts with "+", treat as international: keep "+" and digits only (max 15 per E.164).
  // - Otherwise, auto-format as US/CA-style "(555) 555-5555".
  const formatPhone = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('+')) {
      const digits = trimmed.slice(1).replace(/\D/g, '').slice(0, 15);
      return `+${digits}`;
    }
    const digits = trimmed.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length < 4) return `(${digits}`;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };
  // Valid if it's a US/CA 10-digit number, OR a "+"-prefixed international number with 7-15 digits.
  const isValidPhone = (val: string) => {
    if (!val) return false;
    if (val.trim().startsWith('+')) {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }
    return val.replace(/\D/g, '').length === 10;
  };

  const [shippingPhoneTouched, setShippingPhoneTouched] = useState(false);
  const [billingPhoneTouched, setBillingPhoneTouched] = useState(false);
  const shippingPhoneError = shippingPhoneTouched && !!shippingForm.phone && !isValidPhone(shippingForm.phone);
  const billingPhoneError = billingPhoneTouched && !!billingForm.phone && !isValidPhone(billingForm.phone);

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const next = name === 'phone' ? formatPhone(value) : value;
    setShippingForm(prev => ({ ...prev, [name]: next }));
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const next = name === 'phone' ? formatPhone(value) : value;
    setBillingForm(prev => ({ ...prev, [name]: next }));
  };

  const [cartItems, setCartItems] = useState<any[]>([]);

  const fetchCart = () => {
    let sessionId = localStorage.getItem('cartSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cartSessionId', sessionId);
    }
    
    fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.cart || !data.cart.items || data.cart.items.length === 0) {
          navigate('/cart');
          return;
        }
        if (data.cart && data.cart.items) {
          const mapped = data.cart.items.map((item: any) => {
            const customBuild = item.customBuild;
            if (customBuild && typeof customBuild === 'object') {
              return {
                id: item._id || customBuild._id || Math.random(),
                type: 'customBuild',
                itemId: customBuild._id,
                name: customBuild.name || 'Custom Build',
                price: item.price || customBuild.total || 0,
                quantity: item.quantity || 1,
                notes: item.notes,
              };
            }

            // Pick the right populated doc for this item type. The previous
            // version only covered product/pcPart/accessory, so merch and
            // optimization rows rendered as "Item · $0".
            let type: 'product' | 'pcPart' | 'accessory' | 'merch' | 'optimization' = 'product';
            let product: any = null;
            if (item.product) { type = 'product'; product = item.product; }
            else if (item.pcPart) { type = 'pcPart'; product = item.pcPart; }
            else if (item.accessory) { type = 'accessory'; product = item.accessory; }
            else if (item.merch) { type = 'merch'; product = item.merch; }
            else if (item.optimization) { type = 'optimization'; product = item.optimization; }

            const fallbackName =
              type === 'optimization' ? 'Optimization' :
              type === 'merch'        ? 'Merch' :
              type === 'accessory'    ? 'Accessory' :
              type === 'pcPart'       ? 'Part' :
                                        'Product';

            return {
              id: item._id || product?._id || Math.random(),
              type,
              itemId: product?._id || product,
              name: product?.name || fallbackName,
              price: Number(item.price) || Number(product?.price) || 0,
              quantity: item.quantity || 1,
              size: item.size,
              color: item.color,
              notes: item.notes,
            };
          });
          setCartItems(mapped);
          setCustomDiscountAmount(data.cart.customDiscountAmount || 0);
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
            taxRate: data.settings.taxRate ?? 8.0,
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
    
    fetch(`${process.env.REACT_APP_API_URL}/donation-causes/active`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveCauses(data);
          if (data.length > 0) {
            setSelectedCauseId(data[0]._id);
          }
        }
      })
      .catch(console.error);

    return () => {
      clearTimeout(sseTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const calculateSubtotal = () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Auto-apply discount if it exists in local storage
  React.useEffect(() => {
    if (cartItems.length > 0 && discountCode && !appliedDiscount && !promoError) {
      // Small timeout to ensure calculateSubtotal has the latest cart items
      const timeoutId = setTimeout(() => {
        handleApplyDiscount();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, discountCode, appliedDiscount, promoError]);

  const getAppliedDiscountAmount = () => {
    if (!appliedDiscount || appliedDiscount.type === 'free_shipping') return 0;
    if (appliedDiscount.type === 'percentage') return calculateSubtotal() * (appliedDiscount.value / 100);
    return Math.min(appliedDiscount.value, calculateSubtotal());
  };

  const calculateTax = () => {
    if (!storeSettings.taxEnabled) return 0;
    const applicableShipping = hasShippingMethod ? calculateShipping() : 0;
    return Math.max(0, calculateSubtotal() - customDiscountAmount - getAppliedDiscountAmount() + applicableShipping) * (storeSettings.taxRate / 100);
  };
  const calculateShipping = () => {
    let cost = shippingMethodCost;
    let isGround = shippingMethod === 'standard';
    
    if (shippoRates.length > 0) {
      const selectedRate = shippoRates.find(r => r.objectId === shippingMethod);
      if (selectedRate) {
        cost = parseFloat(selectedRate.amount);
        const title = (selectedRate.title || selectedRate.displayName || selectedRate.provider || '').toLowerCase();
        isGround = title.includes('ground') || title.includes('standard');
      }
    }

    if (appliedDiscount && appliedDiscount.type === 'free_shipping' && isGround) {
      return 0;
    }

    return cost;
  };
  const calculateInsurance = () => {
    if (appliedDiscount && appliedDiscount.type === 'free_shipping') return 0;
    if (!shippingInsurance) return 0;
    return Math.max(0, calculateSubtotal() - customDiscountAmount + calculateShipping()) * 0.0125;
  };
  const calculateDonation = () => {
    switch (donationOption) {
      case 'roundup':
        const applicableShipping = hasShippingMethod ? calculateShipping() : 0;
        const applicableInsurance = hasShippingMethod ? calculateInsurance() : 0;
        const totalBeforeDonation = calculateSubtotal() + calculateTax() + applicableShipping + applicableInsurance;
        return Math.ceil(totalBeforeDonation) - totalBeforeDonation;
      case 'fixed': return 5.00;
      case 'custom': return parseFloat(customDonation) || 0;
      default: return 0;
    }
  };
  const hasShippingMethod = !!shippingMethod && (shippoRates.length > 0 || ['standard', 'express', 'overnight'].includes(shippingMethod));
  const displayShipping = hasShippingMethod ? calculateShipping() : 0;
  const displayInsurance = hasShippingMethod ? calculateInsurance() : 0;
  const displayDonation = calculateDonation();

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'affirm'>('paypal');

  const calculateTotalBeforeGiftCard = () => {
    return Math.max(0, calculateSubtotal() + calculateTax() + displayShipping + displayInsurance + displayDonation - customDiscountAmount - getAppliedDiscountAmount());
  };

  const getAppliedGiftCardAmount = () => {
    if (!appliedGiftCard) return 0;
    return Math.min(appliedGiftCard.balance, calculateTotalBeforeGiftCard());
  };

  const calculateTotal = () => {
    let baseTotal = Math.max(0, calculateTotalBeforeGiftCard() - getAppliedGiftCardAmount());
    if (selectedPaymentMethod === 'affirm') {
      baseTotal = baseTotal * 1.0699; // Add 6.99% surcharge silently
    }
    return baseTotal;
  };

  const processOrder = async (paymentMethodType: string, transactionId: string) => {
    setIsProcessing(true);
    setPaymentError(null);

    const sessionId = localStorage.getItem('cartSessionId');
    let orderId = '';
    
    try {
      const finalBilling = useSameAddress ? shippingForm : billingForm;
      const orderPayload = {
        items: cartItems.map(i => ({ [i.type]: i.itemId, quantity: i.quantity })),
        customerId: customerId || undefined,
        shippingAddress: {
          firstName: shippingForm.firstName,
          lastName: shippingForm.lastName,
          email: shippingForm.email,
          phone: shippingForm.phone,
          address: shippingForm.address + (shippingForm.apartment ? ` ${shippingForm.apartment}` : ''),
          city: shippingForm.city,
          state: shippingForm.state,
          zip: shippingForm.zip,
          country: shippingForm.country
        },
        billingAddress: {
          firstName: finalBilling.firstName,
          lastName: finalBilling.lastName,
          email: finalBilling.email,
          phone: finalBilling.phone,
          address: finalBilling.address + (finalBilling.apartment ? ` ${finalBilling.apartment}` : ''),
          city: finalBilling.city,
          state: finalBilling.state,
          zip: finalBilling.zip,
          country: finalBilling.country
        },
        paymentMethod: paymentMethodType,
        discountCode: discountCode || undefined,
        giftCardCode: appliedGiftCard?.code || undefined,
        shippingAmount: calculateShipping(),
        shippingInsurance: calculateInsurance(),
        shippingRates: shippoRates,
        selectedShippingRate: shippoRates.find(r => r.objectId === shippingMethod) || null,
        donationCause: selectedCauseId || undefined,
        donationAmount: calculateDonation(),
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const orderData = await res.json();
      if (orderData && orderData.order) {
        orderId = orderData.order._id;
        
        try {
          await fetch(`${process.env.REACT_APP_API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: calculateTotal(),
              currency: 'usd',
              paymentMethod: paymentMethodType,
              gatewayTransactionId: transactionId,
              orderId: orderData.order._id,
              customerId: orderData.order.customer,
              status: 'completed'
            })
          });
        } catch (paymentErr) {
          console.error('Failed to post payment success to API:', paymentErr);
        }
      }
      
      if (sessionId) {
        await fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [], clearDiscount: true })
        });
      }
    } catch (e) {
      console.error('Failed to create order', e);
    }
    
    window.location.href = `/order-status${orderId ? `?id=${orderId}` : ''}`;
  };

  const handleAffirmApprove = async () => {
    if (!window.affirm) {
      setPaymentError("Affirm is not initialized. Please try refreshing the page.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const finalBilling = useSameAddress ? shippingForm : billingForm;

    let isGround = shippingMethod === 'standard';
    if (shippoRates.length > 0) {
      const selectedRate = shippoRates.find(r => r.objectId === shippingMethod);
      if (selectedRate) {
        const title = (selectedRate.title || selectedRate.displayName || selectedRate.provider || '').toLowerCase();
        isGround = title.includes('ground') || title.includes('standard');
      }
    }

    // Stash the would-be-order on the server. We do NOT create an order
    // here — that only happens after Affirm captures successfully, inside
    // /api/payments/affirm/confirm. If the customer abandons Affirm, the
    // stashed payload TTLs out and nothing is left behind.
    let pendingToken: string | null = null;
    try {
      const orderPayload = {
        items: cartItems.map(i => ({ [i.type]: i.itemId, quantity: i.quantity })),
        customerId: customerId || undefined,
        shippingAddress: {
          firstName: shippingForm.firstName,
          lastName: shippingForm.lastName,
          email: shippingForm.email,
          phone: shippingForm.phone,
          address: shippingForm.address + (shippingForm.apartment ? ` ${shippingForm.apartment}` : ''),
          city: shippingForm.city,
          state: shippingForm.state,
          zip: shippingForm.zip,
          country: shippingForm.country
        },
        billingAddress: {
          firstName: finalBilling.firstName,
          lastName: finalBilling.lastName,
          email: finalBilling.email,
          phone: finalBilling.phone,
          address: finalBilling.address + (finalBilling.apartment ? ` ${finalBilling.apartment}` : ''),
          city: finalBilling.city,
          state: finalBilling.state,
          zip: finalBilling.zip,
          country: finalBilling.country
        },
        paymentMethod: 'affirm',
        discountCode: discountCode || undefined,
        giftCardCode: appliedGiftCard?.code || undefined,
        shippingAmount: calculateShipping(),
        shippingInsurance: calculateInsurance(),
        shippingRates: shippoRates,
        selectedShippingRate: shippoRates.find(r => r.objectId === shippingMethod) || null,
        donationCause: selectedCauseId || undefined,
        donationAmount: calculateDonation(),
        cartSessionId: localStorage.getItem('cartSessionId') || undefined,
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL}/payments/affirm/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const body = await res.json();
      if (!res.ok || !body?.token) {
        throw new Error(body?.message || 'Could not start the Affirm checkout.');
      }
      pendingToken = body.token;
    } catch (err: any) {
      console.error('Affirm init failed', err);
      setIsProcessing(false);
      setPaymentError(err?.message || 'Could not start the Affirm checkout. Please try again.');
      return;
    }

    // Convert cart items to Affirm format
    const affirmItems = cartItems.map(item => ({
      display_name: item.name,
      sku: item.id.toString(),
      unit_price: Math.round(item.price * 100), // in cents
      qty: item.quantity,
      item_image_url: item.image,
      item_url: `${window.location.origin}/product/${item.id}`
    }));

    const totalAmount = Math.round(calculateTotal() * 100);
    const taxAmount = Math.round(calculateTax() * 100);
    const shippingAmount = Math.round(calculateShipping() * 100);

    const checkoutObject = {
      merchant: {
        user_confirmation_url: `${process.env.REACT_APP_API_URL}/payments/affirm/confirm`,
        user_cancel_url: `${window.location.origin}/checkout?affirm=cancelled`,
        user_confirmation_url_action: "POST"
      },
      shipping: {
        name: {
          first: shippingForm.firstName,
          last: shippingForm.lastName
        },
        address: {
          line1: shippingForm.address,
          line2: shippingForm.apartment || '',
          city: shippingForm.city,
          state: shippingForm.state,
          zipcode: shippingForm.zip,
          country: shippingForm.country || 'USA'
        },
        phone_number: shippingForm.phone,
        email: shippingForm.email
      },
      billing: {
        name: {
          first: finalBilling.firstName,
          last: finalBilling.lastName
        },
        address: {
          line1: finalBilling.address,
          line2: finalBilling.apartment || '',
          city: finalBilling.city,
          state: finalBilling.state,
          zipcode: finalBilling.zip,
          country: finalBilling.country || 'USA'
        },
        phone_number: finalBilling.phone,
        email: finalBilling.email
      },
      items: affirmItems,
      metadata: {
        shipping_type: isGround ? "Ground" : "Expedited",
        lanforge_pending_token: pendingToken,
      },
      // Affirm echoes this back on the authorize response — the server uses it
      // to find the stashed checkout payload when finalizing.
      order_id: pendingToken,
      currency: "USD",
      financing_program: "",
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      total: totalAmount
    };

    // @ts-ignore
    window.affirm.checkout(checkoutObject);

    // @ts-ignore
    window.affirm.checkout.open({
      onFail: (error: any) => {
        setIsProcessing(false);
        setPaymentError(error?.reason || "Affirm checkout failed.");
      },
      onSuccess: async (_data: any) => {
        // Affirm posts to user_confirmation_url and the server handles
        // capture + finalization. No-op here.
      }
    });
  };

  React.useEffect(() => {
    // The server now finalizes Affirm orders end-to-end and redirects the
    // browser to /order-status on success. This effect only surfaces error
    // states the server may bounce back to /checkout with.
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err && err.startsWith('affirm_')) {
      const chargeId = params.get('charge_id');
      const messages: Record<string, string> = {
        affirm_missing_token: 'Affirm did not return a checkout token. Please try again.',
        affirm_authorize_failed: 'Affirm could not authorize the loan. Please try again or use another method.',
        affirm_missing_order_id: 'We could not match your Affirm checkout to a pending cart. Please try again.',
        affirm_pending_not_found: 'Your Affirm checkout expired before it completed. Please try again.',
        affirm_order_create_failed: 'Affirm authorized but we could not create your order. The authorization has been released. Please try again or contact support.',
        affirm_capture_failed: 'Affirm authorized the charge but capture failed. Please contact support.',
        affirm_failed: 'Affirm checkout failed. Please try again.',
      };
      const message = messages[err] || 'Affirm checkout failed.';
      setPaymentError(chargeId ? `${message} (Charge ID: ${chargeId})` : message);
      setIsProcessing(false);
    } else if (params.get('affirm') === 'cancelled') {
      setPaymentError('Affirm checkout was cancelled.');
      setIsProcessing(false);
    }
  }, []);

  const handlePayPalApprove = async (data: any, actions: any) => {
    await processOrder('paypal', data.orderID);
  };

  const fetchShippoRates = async () => {
    setIsFetchingRates(true);
    try {
      const addressTo = {
        name: `${shippingForm.firstName} ${shippingForm.lastName}`,
        street1: shippingForm.address,
        street2: shippingForm.apartment,
        city: shippingForm.city,
        state: shippingForm.state,
        zip: shippingForm.zip,
        country: shippingForm.country,
        phone: shippingForm.phone,
        email: shippingForm.email,
      };

      // const parcels = [
      //   {
      //     length: '10',
      //     width: '15',
      //     height: '10',
      //     distanceUnit: 'in',
      //     weight: '1',
      //     massUnit: 'lb',
      //   }
      // ];

      const lineItems = cartItems.map(item => ({
        currency: 'USD',
        manufacture_country: 'US',
        quantity: item.quantity,
        sku: item.id.toString(),
        title: item.name,
        total_price: item.price.toString(),
        weight: '10', // Default weight since it's not stored in cart item currently
        weight_unit: 'lb'
      }));

      const res = await fetch(`${process.env.REACT_APP_API_URL}/shipping/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressTo, lineItems }),
      });

      if (res.ok) {
        const data = await res.json();
        // Backend already handles filtering, mapping, and sorting
        const finalRates = data.rates || [];
        setShippoRates(finalRates);
        if (finalRates.length > 0) {
          setShippingMethod(finalRates[0].objectId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rates', error);
    } finally {
      setIsFetchingRates(false);
    }
  };

  // Derived form-validity helpers (replace the old activeSection/completedSections gating)
  const shippingRequired = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
  const isShippingAddressValid =
    shippingRequired.every(f => (shippingForm as any)[f]) && isValidPhone(shippingForm.phone);
  const isBillingAddressValid = useSameAddress
    ? isShippingAddressValid
    : shippingRequired.every(f => (billingForm as any)[f]) && isValidPhone(billingForm.phone);
  const isDonationValid = donationOption !== 'custom' || (!!customDonation && !isNaN(parseFloat(customDonation)) && parseFloat(customDonation) > 0);
  const canCheckout = cartItems.length > 0 && isShippingAddressValid && isBillingAddressValid && hasShippingMethod && isDonationValid;

  const isUSShipping = (shippingForm.country || 'US') === 'US';

  // Affirm is US-only — auto-switch to PayPal if the customer changes to an international destination
  React.useEffect(() => {
    if (!isUSShipping && selectedPaymentMethod === 'affirm') {
      setSelectedPaymentMethod('paypal');
    }
  }, [isUSShipping, selectedPaymentMethod]);

  // Auto-fetch Shippo rates once the shipping address is complete (debounced)
  React.useEffect(() => {
    if (!isShippingAddressValid) return;
    const t = setTimeout(() => {
      fetchShippoRates();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingForm.address, shippingForm.apartment, shippingForm.city, shippingForm.state, shippingForm.zip, shippingForm.country]);

  // Auto-init customer once both addresses are valid
  React.useEffect(() => {
    if (!isShippingAddressValid || !isBillingAddressValid) return;
    if (customerId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/customers/checkout-init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddress: shippingForm,
            billingAddress: useSameAddress ? shippingForm : billingForm
          })
        });
        const data = await res.json();
        if (!cancelled && data?.customer?._id) setCustomerId(data.customer._id);
      } catch (err) {
        console.error('Failed to init customer', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShippingAddressValid, isBillingAddressValid, useSameAddress]);

  // ───────────────────────────── shared styles ─────────────────────────────
  const inputClass = "w-full bg-[#0a0d14] border border-[#1f2233] hover:border-[#2a2f44] focus:border-[#00ff9d]/50 focus:ring-2 focus:ring-[#00ff9d]/15 outline-none transition-all rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 disabled:opacity-50";
  const labelClass = "block text-xs uppercase tracking-wider text-gray-500 mb-1.5 font-medium";
  const cardClass = "bg-[#0f1218]/80 backdrop-blur-sm border border-[#1f2233] rounded-2xl";
  const sectionHeaderNum = (n: number, complete: boolean) => (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all ${complete ? 'bg-gradient-to-br from-[#00ff9d] to-[#3a86ff] text-black shadow-[0_0_15px_rgba(0,255,157,0.35)]' : 'bg-[#1f2233] text-gray-400'}`}>
      {complete ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : n}
    </span>
  );

  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const summaryHasContent = cartItems.length > 0;

  // ───────────────────────────── totals chunk (shared by sticky + mobile) ─────────────────────────────
  const renderTotals = () => (
    <div className="p-5 space-y-2 text-sm">
      <div className="flex justify-between text-gray-400"><span>Subtotal</span><span className="text-white tabular-nums">${calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      {hasShippingMethod && (
        <>
          <div className="flex justify-between text-gray-400">
            <span>Shipping</span>
            <span className="text-white tabular-nums">
              {calculateShipping() === 0 && appliedDiscount && appliedDiscount.type === 'free_shipping' ? 'FREE' : `$${calculateShipping().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Shipping insurance</span>
            <span className="text-white tabular-nums">
              {calculateInsurance() === 0 && appliedDiscount && appliedDiscount.type === 'free_shipping' ? 'FREE' : `$${calculateInsurance().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </>
      )}
      {storeSettings.taxEnabled && storeSettings.taxRate > 0 && (
        <div className="flex justify-between text-gray-400"><span>Tax ({storeSettings.taxRate}%)</span><span className="text-white tabular-nums">${calculateTax().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      )}
      {displayDonation > 0 && (
        <div className="flex justify-between text-gray-400"><span>Your donation</span><span className="text-white tabular-nums">${displayDonation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      )}
      {appliedDiscount && appliedDiscount.type !== 'free_shipping' && (
        <div className="flex justify-between text-emerald-400"><span>Discount ({appliedDiscount.code})</span><span className="tabular-nums">-${(appliedDiscount.type === 'percentage' ? calculateSubtotal() * (appliedDiscount.value / 100) : Math.min(appliedDiscount.value, calculateSubtotal())).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      )}
      {appliedDiscount && appliedDiscount.type === 'free_shipping' && (
        <div className="flex justify-between text-emerald-400">
          <span>Discount ({appliedDiscount.code})</span>
          <span>
            {(() => {
              let isGround = shippingMethod === 'standard';
              if (shippoRates.length > 0) {
                const selectedRate = shippoRates.find(r => r.objectId === shippingMethod);
                if (selectedRate) {
                  const title = (selectedRate.title || selectedRate.displayName || selectedRate.provider || '').toLowerCase();
                  isGround = title.includes('ground') || title.includes('standard');
                }
              }
              return isGround ? 'Free Ground' : 'Ground only';
            })()}
          </span>
        </div>
      )}
      {customDiscountAmount > 0 && (
        <div className="flex justify-between text-emerald-400"><span>Custom Discount</span><span className="tabular-nums">-${customDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      )}
      {appliedGiftCard && getAppliedGiftCardAmount() > 0 && (
        <div className="flex justify-between text-emerald-400"><span>Gift Card ({appliedGiftCard.code})</span><span className="tabular-nums">-${getAppliedGiftCardAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      )}
      <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-[#1f2233]">
        <span className="text-white font-semibold">Total</span>
        <span className="text-2xl font-bold tabular-nums bg-gradient-to-r from-[#00ff9d] to-[#3a86ff] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(0,255,157,0.25)]">
          ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );

  const renderPromoAndItems = () => (
    <>
      {summaryHasContent && (
        <div className="px-5 py-4 border-b border-[#1f2233] space-y-3 max-h-72 overflow-y-auto">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="text-white truncate">{item.name}</div>
                {item.notes && <div className="text-xs text-emerald-400 mt-0.5 truncate">{item.notes}</div>}
                <div className="text-xs text-gray-500 mt-0.5">Qty {item.quantity}</div>
              </div>
              <span className="text-white tabular-nums shrink-0">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}

      <div className="p-5 border-b border-[#1f2233] space-y-2">
        <label className={labelClass}>Discount or Gift Card</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter code"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); } }}
            className={inputClass + " font-mono"}
          />
          <button
            type="button"
            onClick={() => handleApplyPromo()}
            disabled={isApplyingPromo || !promoInput.trim()}
            className="shrink-0 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isApplyingPromo ? '...' : 'Apply'}
          </button>
        </div>
        <AnimatePresence>
          {promoError && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-400 text-xs overflow-hidden">{promoError}</motion.p>
          )}
          {appliedDiscount && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between text-xs text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1.5"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>Discount {appliedDiscount.code}</span>
              <button type="button" className="text-gray-400 hover:text-white" onClick={() => { setAppliedDiscount(null); setDiscountCode(''); localStorage.removeItem('autoDiscountCode'); }}>Remove</button>
            </motion.div>
          )}
          {appliedGiftCard && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between text-xs text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/20 rounded-lg px-3 py-2 gap-2">
              <span className="flex items-center gap-1.5 min-w-0 truncate"><svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg><span className="truncate">{appliedGiftCard.code} · ${appliedGiftCard.balance.toFixed(2)}</span></span>
              <button type="button" className="text-gray-400 hover:text-white shrink-0" onClick={() => setAppliedGiftCard(null)}>Remove</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  const sectionMotion = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay }
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white relative">
      {/* Ambient background glow — its own wrapper clips the blurs so the
          outer container can stay overflow:visible (required for the sticky
          order summary to actually stick to the viewport). */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#00ff9d]/[0.08] blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[#3a86ff]/[0.06] blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-[#1f2233]/60 bg-gray-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo-2.png" alt="LANForge" className="h-6 w-auto" />
          </Link>
          <Link to="/cart" className="text-sm text-gray-400 hover:text-[#00ff9d] transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to cart
          </Link>
        </div>
      </header>

      {/* Mobile order summary toggle */}
      <div className="lg:hidden relative border-b border-[#1f2233]/60 bg-gray-950/70 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(o => !o)}
          className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-sm"
        >
          <span className="flex items-center gap-2 text-gray-300">
            <svg className={`w-4 h-4 transition-transform ${mobileSummaryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {mobileSummaryOpen ? 'Hide order summary' : 'Show order summary'}
            <span className="text-gray-500">({cartItems.length})</span>
          </span>
          <span className="font-bold tabular-nums bg-gradient-to-r from-[#00ff9d] to-[#3a86ff] bg-clip-text text-transparent">
            ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </button>
        <AnimatePresence>
          {mobileSummaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className={cardClass + " m-4 overflow-hidden"}>
                {renderPromoAndItems()}
                {renderTotals()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Checkout</h1>
          <p className="text-gray-500 text-sm mt-1">Complete your order securely.</p>
        </motion.div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6 lg:gap-10">
          {/* MAIN COLUMN */}
          <div className="space-y-5 min-w-0">

            {/* Contact & Shipping */}
            <motion.section {...sectionMotion(0)} className={cardClass + " p-5 sm:p-6"}>
              <div className="flex items-center gap-3 mb-5">
                {sectionHeaderNum(1, isShippingAddressValid)}
                <h2 className="text-base sm:text-lg font-semibold text-white">Contact & Shipping</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" value={shippingForm.email} onChange={handleShippingChange} placeholder="you@example.com" className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    value={shippingForm.phone}
                    onChange={handleShippingChange}
                    onBlur={() => setShippingPhoneTouched(true)}
                    placeholder="(555) 555-5555"
                    className={inputClass + (shippingPhoneError ? ' border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20' : '')}
                    aria-invalid={shippingPhoneError}
                    required
                  />
                  {shippingPhoneError && (
                    <p className="text-red-400 text-xs mt-1.5">Enter a valid phone number (e.g. (555) 555-5555 or +44 7700 900000).</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>First name</label>
                  <input type="text" name="firstName" value={shippingForm.firstName} onChange={handleShippingChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Last name</label>
                  <input type="text" name="lastName" value={shippingForm.lastName} onChange={handleShippingChange} required className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Address</label>
                  <MapboxAddressAutocomplete
                    name="address"
                    value={shippingForm.address}
                    onChange={(val) => setShippingForm((prev) => ({ ...prev, address: val }))}
                    onSelect={handleShippingAddressSelect}
                    required
                    placeholder="Start typing..."
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Apartment, suite, etc. <span className="text-gray-600 normal-case tracking-normal">(optional)</span></label>
                  <input type="text" name="apartment" value={shippingForm.apartment} onChange={handleShippingChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="city" value={shippingForm.city} onChange={handleShippingChange} required className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>State</label>
                    <input type="text" name="state" value={shippingForm.state} onChange={handleShippingChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>ZIP</label>
                    <input type="text" name="zip" value={shippingForm.zip} onChange={handleShippingChange} required className={inputClass} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Country</label>
                  <select name="country" value={shippingForm.country} onChange={handleShippingChange} required className={inputClass}>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="MX">Mexico</option>
                    <option value="GB">United Kingdom</option>
                    <option value="IE">Ireland</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="CH">Switzerland</option>
                    <option value="AT">Austria</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                    <option value="AU">Australia</option>
                    <option value="NZ">New Zealand</option>
                    <option value="JP">Japan</option>
                    <option value="SG">Singapore</option>
                  </select>
                </div>
              </div>
            </motion.section>

            {/* Shipping Method */}
            <motion.section {...sectionMotion(0.05)} className={cardClass + " p-5 sm:p-6"}>
              <div className="flex items-center gap-3 mb-5">
                {sectionHeaderNum(2, hasShippingMethod && isShippingAddressValid)}
                <h2 className="text-base sm:text-lg font-semibold text-white">Shipping Method</h2>
              </div>
              {!isShippingAddressValid ? (
                <div className="p-4 rounded-lg bg-[#0a0d14] border border-dashed border-[#1f2233] text-sm text-gray-500">
                  Enter your shipping address above to see available rates.
                </div>
              ) : isFetchingRates ? (
                <div className="p-5 rounded-lg bg-[#0a0d14] border border-[#1f2233] flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-[#00ff9d]/30 border-t-[#00ff9d] rounded-full animate-spin" />
                  Calculating shipping rates...
                </div>
              ) : (
                <div className="space-y-2">
                  {shippoRates.length > 0 ? (
                    shippoRates.map((rate) => {
                      const title = (rate.title || rate.displayName || rate.provider || '').toLowerCase();
                      const isRateGround = title.includes('ground') || title.includes('standard');
                      const isFree = appliedDiscount && appliedDiscount.type === 'free_shipping' && isRateGround;
                      const selected = shippingMethod === rate.objectId;
                      return (
                        <label key={rate.objectId} className={`block cursor-pointer rounded-xl border transition-all ${selected ? 'border-[#00ff9d]/50 bg-[#00ff9d]/[0.05] shadow-[0_0_20px_rgba(0,255,157,0.08)]' : 'border-[#1f2233] bg-[#0a0d14] hover:border-[#2a2f44]'}`}>
                          <input type="radio" name="shippingMethod" value={rate.objectId} checked={selected} onChange={() => { setShippingMethod(rate.objectId); setShippingMethodCost(parseFloat(rate.amount)); }} className="sr-only" />
                          <div className="flex items-center justify-between p-4 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'border-[#00ff9d]' : 'border-gray-600'}`}>
                                {selected && <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_6px_rgba(0,255,157,0.6)]" />}
                              </span>
                              <div className="min-w-0">
                                <div className="text-sm text-white truncate">{rate.title || rate.displayName || `${rate.provider} ${rate.servicelevel?.name}`}</div>
                                <div className="text-xs text-gray-500">Est. {rate.estimatedDays || '3-5'} {String(rate.estimatedDays) === '1' ? 'business day' : 'business days'}</div>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-white tabular-nums shrink-0">{isFree ? 'FREE' : `$${parseFloat(rate.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400">
                      No shipping methods available for this address. Please verify it's correct.
                    </div>
                  )}
                </div>
              )}

              {hasShippingMethod && (
                <label className="flex items-start gap-3 p-4 mt-3 rounded-xl border border-[#1f2233] bg-[#0a0d14] cursor-pointer hover:border-[#2a2f44] transition-colors">
                  <input
                    type="checkbox"
                    checked={shippingInsurance || (appliedDiscount && appliedDiscount.type === 'free_shipping')}
                    disabled={appliedDiscount && appliedDiscount.type === 'free_shipping'}
                    onChange={(e) => setShippingInsurance(e.target.checked)}
                    className="mt-0.5 accent-[#00ff9d]"
                  />
                  <div className="flex-1 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-white">Shipping insurance</div>
                      <div className="text-xs text-gray-500">Protect your order during shipping</div>
                    </div>
                    <span className="text-sm text-white tabular-nums shrink-0">
                      {appliedDiscount && appliedDiscount.type === 'free_shipping' ? 'FREE' : `+$${(Math.max(0, calculateSubtotal() - customDiscountAmount + calculateShipping()) * 0.0125).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </label>
              )}

              <p className="text-xs text-gray-500 pt-3 leading-relaxed">
                <span className="text-[#00ff9d] font-semibold">Note:</span> Estimated delivery starts <em>after</em> LANForge processes and ships your order.
              </p>

              {!isUSShipping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/30 flex items-start gap-3"
                >
                  <FontAwesomeIcon icon={faShieldHalved} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs leading-relaxed">
                    <p className="text-amber-300 font-semibold mb-1">International order</p>
                    <p className="text-amber-200/80">
                      Import duties, VAT, and customs fees aren't included in this total and will be
                      collected by the carrier on delivery. These charges vary by destination — please
                      check your country's import rules before ordering.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.section>

            {/* Billing */}
            <motion.section {...sectionMotion(0.08)} className={cardClass + " p-5 sm:p-6"}>
              <div className="flex items-center gap-3 mb-5">
                {sectionHeaderNum(3, isBillingAddressValid)}
                <h2 className="text-base sm:text-lg font-semibold text-white">Billing Address</h2>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer select-none">
                <input type="checkbox" checked={useSameAddress} onChange={(e) => setUseSameAddress(e.target.checked)} className="accent-[#00ff9d]" />
                Same as shipping address
              </label>
              <AnimatePresence initial={false}>
                {!useSameAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
                      <div><label className={labelClass}>First name</label><input type="text" name="firstName" value={billingForm.firstName} onChange={handleBillingChange} required className={inputClass} /></div>
                      <div><label className={labelClass}>Last name</label><input type="text" name="lastName" value={billingForm.lastName} onChange={handleBillingChange} required className={inputClass} /></div>
                      <div><label className={labelClass}>Email</label><input type="email" name="email" value={billingForm.email} onChange={handleBillingChange} required className={inputClass} /></div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          inputMode="tel"
                          autoComplete="tel"
                          maxLength={20}
                          value={billingForm.phone}
                          onChange={handleBillingChange}
                          onBlur={() => setBillingPhoneTouched(true)}
                          placeholder="(555) 555-5555"
                          className={inputClass + (billingPhoneError ? ' border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20' : '')}
                          aria-invalid={billingPhoneError}
                          required
                        />
                        {billingPhoneError && (
                          <p className="text-red-400 text-xs mt-1.5">Enter a valid phone number (e.g. (555) 555-5555 or +44 7700 900000).</p>
                        )}
                      </div>
                      <div className="sm:col-span-2"><label className={labelClass}>Address</label><input type="text" name="address" value={billingForm.address} onChange={handleBillingChange} required className={inputClass} /></div>
                      <div className="sm:col-span-2"><label className={labelClass}>Apartment, suite, etc.</label><input type="text" name="apartment" value={billingForm.apartment} onChange={handleBillingChange} className={inputClass} /></div>
                      <div><label className={labelClass}>City</label><input type="text" name="city" value={billingForm.city} onChange={handleBillingChange} required className={inputClass} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>State</label><input type="text" name="state" value={billingForm.state} onChange={handleBillingChange} required className={inputClass} /></div>
                        <div><label className={labelClass}>ZIP</label><input type="text" name="zip" value={billingForm.zip} onChange={handleBillingChange} required className={inputClass} /></div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Country</label>
                        <select name="country" value={billingForm.country} onChange={handleBillingChange} required className={inputClass}>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="MX">Mexico</option>
                          <option value="GB">United Kingdom</option>
                          <option value="IE">Ireland</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="NL">Netherlands</option>
                          <option value="BE">Belgium</option>
                          <option value="ES">Spain</option>
                          <option value="IT">Italy</option>
                          <option value="CH">Switzerland</option>
                          <option value="AT">Austria</option>
                          <option value="SE">Sweden</option>
                          <option value="NO">Norway</option>
                          <option value="DK">Denmark</option>
                          <option value="FI">Finland</option>
                          <option value="AU">Australia</option>
                          <option value="NZ">New Zealand</option>
                          <option value="JP">Japan</option>
                          <option value="SG">Singapore</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Donation — only when at least one active cause exists for this timeframe */}
            {activeCauses.length > 0 && (
            <motion.section {...sectionMotion(0.1)} className={cardClass + " p-5 sm:p-6"}>
              <div className="flex items-center gap-3 mb-1">
                {sectionHeaderNum(4, true)}
                <h2 className="text-base sm:text-lg font-semibold text-white">Support a Cause <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1">optional</span></h2>
              </div>
              <p className="text-xs text-gray-500 mb-4 pl-10">LANForge donates with every PC purchased.</p>

              {activeCauses.length > 0 && (
                <div className="space-y-2 mb-3">
                  {activeCauses.map(cause => {
                    const selected = selectedCauseId === cause._id;
                    return (
                      <label key={cause._id} className={`block cursor-pointer rounded-xl border transition-all ${selected ? 'border-[#00ff9d]/50 bg-[#00ff9d]/[0.05] shadow-[0_0_20px_rgba(0,255,157,0.08)]' : 'border-[#1f2233] bg-[#0a0d14] hover:border-[#2a2f44]'}`}>
                        <input type="radio" name="selectedCause" value={cause._id} checked={selected} onChange={(e) => setSelectedCauseId(e.target.value)} className="sr-only" />
                        <div className="flex items-center gap-3 p-3.5">
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'border-[#00ff9d]' : 'border-gray-600'}`}>
                            {selected && <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_6px_rgba(0,255,157,0.6)]" />}
                          </span>
                          {cause.imageUrl && <img src={cause.imageUrl} alt={cause.name} className="w-10 h-10 object-contain rounded-lg bg-white/90 p-1 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-white truncate">{cause.name}</div>
                            <p className="text-xs text-gray-500 truncate">{cause.description}</p>
                            <p className="text-[11px] text-[#00ff9d] mt-0.5">${cause.lanforgeContributionPerPC} per PC</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { value: 'none', label: 'None' },
                  { value: 'roundup', label: 'Round up' },
                  { value: 'fixed', label: '+$5' },
                  { value: 'custom', label: 'Custom' },
                ] as const).map(opt => {
                  const selected = donationOption === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setDonationOption(opt.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm border transition-all ${selected ? 'border-[#00ff9d]/50 bg-[#00ff9d]/10 text-[#00ff9d]' : 'border-[#1f2233] bg-[#0a0d14] text-gray-300 hover:border-[#2a2f44]'}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {donationOption === 'custom' && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-[200px] mt-3">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customDonation}
                    onChange={(e) => setCustomDonation(e.target.value)}
                    placeholder="10.00"
                    className={inputClass + " pl-7"}
                  />
                </motion.div>
              )}
            </motion.section>
            )}

            {/* Payment */}
            <motion.section {...sectionMotion(0.12)} className={cardClass + " p-5 sm:p-6"}>
              <div className="flex items-center gap-3 mb-5">
                {sectionHeaderNum(activeCauses.length > 0 ? 5 : 4, canCheckout)}
                <h2 className="text-base sm:text-lg font-semibold text-white">Payment</h2>
              </div>

              <div className={`grid gap-2 mb-4 ${isUSShipping ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {(([
                  { value: 'paypal', label: 'PayPal', desc: 'Pay in full' },
                  { value: 'affirm', label: 'Affirm', desc: 'Pay over time' },
                ] as const).filter(m => isUSShipping || m.value !== 'affirm')).map(m => {
                  const selected = selectedPaymentMethod === m.value;
                  return (
                    <button
                      type="button"
                      key={m.value}
                      onClick={() => setSelectedPaymentMethod(m.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${selected ? 'border-[#00ff9d]/50 bg-[#00ff9d]/[0.05] shadow-[0_0_20px_rgba(0,255,157,0.08)]' : 'border-[#1f2233] bg-[#0a0d14] hover:border-[#2a2f44]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'border-[#00ff9d]' : 'border-gray-600'}`}>
                          {selected && <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_6px_rgba(0,255,157,0.6)]" />}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm text-white font-medium">{m.label}</div>
                          <div className="text-xs text-gray-500">{m.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPaymentMethod === 'affirm' && (
                <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 p-3 rounded-lg flex items-start gap-2 mb-4">
                  <FontAwesomeIcon icon={faShieldHalved} className="mt-0.5" />
                  <p><strong>Note:</strong> Paying with Affirm forgoes any PayPal-only pricing discounts on PCs.</p>
                </div>
              )}

              {!canCheckout ? (
                <div className="p-4 rounded-xl bg-[#0a0d14] border border-dashed border-[#1f2233] text-sm text-gray-500 text-center">
                  Complete the fields above to enable checkout.
                </div>
              ) : selectedPaymentMethod === 'paypal' ? (
                <div className="p-4 bg-[#0a0d14] rounded-xl border border-[#1f2233]">
                  <PayPalScriptProvider options={{ "clientId": process.env.REACT_APP_PAYPAL_CLIENT_ID || "", "currency": "USD" }}>
                    <PayPalButtons
                      style={{ layout: "vertical", color: "blue", shape: "rect", label: "paypal" }}
                      createOrder={(data, actions) => {
                        const total = calculateTotal().toFixed(2);
                        const finalBilling = useSameAddress ? shippingForm : billingForm;
                        const payerPhone = finalBilling.phone.replace(/\D/g, '');

                        const payer: any = {};
                        if (finalBilling.email) payer.email_address = finalBilling.email;
                        if (finalBilling.firstName || finalBilling.lastName) {
                          payer.name = {};
                          if (finalBilling.firstName) payer.name.given_name = finalBilling.firstName;
                          if (finalBilling.lastName) payer.name.surname = finalBilling.lastName;
                        }
                        if (finalBilling.zip) {
                          payer.address = {
                            postal_code: finalBilling.zip,
                            country_code: finalBilling.country || 'US'
                          };
                        }
                        if (payerPhone) {
                          payer.phone = {
                            phone_type: 'MOBILE',
                            phone_number: { national_number: payerPhone }
                          };
                        }

                        return actions.order.create({
                          intent: 'CAPTURE',
                          payer: Object.keys(payer).length > 0 ? payer : undefined,
                          purchase_units: [{ amount: { currency_code: 'USD', value: total } }],
                          application_context: { shipping_preference: 'NO_SHIPPING' }
                        });
                      }}
                      onApprove={handlePayPalApprove}
                    />
                  </PayPalScriptProvider>
                  {paymentError && <div className="text-red-400 text-sm mt-3">{paymentError}</div>}
                </div>
              ) : (
                <div className="p-5 bg-white rounded-xl border border-[#1f2233] flex flex-col items-center">
                  <img src="https://cdn-assets.affirm.com/images/blue_logo-transparent_bg.png" alt="Affirm" className="h-7 mb-3 object-contain" />
                  <p className="text-center text-gray-700 text-xs mb-4 max-w-md">You'll be redirected to Affirm to complete your purchase securely.</p>
                  <button type="button" className="w-full max-w-xs py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60" onClick={handleAffirmApprove} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : `Checkout with Affirm · $${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </button>
                  {paymentError && <div className="text-red-400 text-sm mt-3">{paymentError}</div>}
                </div>
              )}

              {isProcessing && (
                <div className="mt-4 p-4 rounded-xl bg-[#0a0d14] border border-[#1f2233] flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#00ff9d]/30 border-t-[#00ff9d] rounded-full animate-spin" />
                  <div>
                    <p className="text-sm text-[#00ff9d] font-medium">Processing your payment...</p>
                    <p className="text-xs text-gray-500">Please don't close or refresh this page.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 mt-4 border-t border-[#1f2233]">
                <FontAwesomeIcon icon={faLock} className="text-[#00ff9d]" />
                <span>256-bit SSL · PCI DSS Compliant</span>
              </div>
            </motion.section>
          </div>

          {/* DESKTOP STICKY SUMMARY */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block lg:sticky lg:top-24 lg:self-start"
          >
            <div className={cardClass + " overflow-hidden shadow-[0_25px_80px_-30px_rgba(0,255,157,0.15)]"}>
              <div className="p-5 border-b border-[#1f2233]">
                <h2 className="text-base font-semibold text-white">Order Summary</h2>
                <p className="text-xs text-gray-500 mt-0.5">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
              </div>
              {renderPromoAndItems()}
              {renderTotals()}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
