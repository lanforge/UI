import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
// @ts-ignore
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import '../App.css';

const libraries: ("places")[] = ["places"];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'shipping' | 'billing' | 'shippingMethod' | 'donation' | 'payment'>('shipping');
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
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
  const [customDiscountAmount, setCustomDiscountAmount] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState('');

  const handleApplyDiscount = async () => {
    setDiscountError('');
    if (!discountCode) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, orderTotal: calculateSubtotal() })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedDiscount(data.discount);
      } else {
        setDiscountError(data.message || 'Invalid discount code');
        setAppliedDiscount(null);
      }
    } catch (e) {
      setDiscountError('Error validating discount code');
      setAppliedDiscount(null);
    }
  };
  
  const [activeCauses, setActiveCauses] = useState<any[]>([]);
  const [selectedCauseId, setSelectedCauseId] = useState<string>('');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.address_components) {
        let address1 = '';
        let locality = '';
        let administrative_area_level_1 = '';
        let postal_code = '';
        let country = 'US';

        for (const component of place.address_components) {
          const componentType = component.types[0];
          switch (componentType) {
            case 'street_number':
              address1 = `${component.long_name} ${address1}`;
              break;
            case 'route':
              address1 += component.short_name;
              break;
            case 'postal_code':
              postal_code = `${component.long_name}`;
              break;
            case 'locality':
              locality = component.long_name;
              break;
            case 'administrative_area_level_1':
              administrative_area_level_1 = component.short_name;
              break;
            case 'country':
              country = component.short_name;
              break;
          }
        }

        setShippingForm((prev) => ({
          ...prev,
          address: address1,
          city: locality,
          state: administrative_area_level_1,
          zip: postal_code,
          country: country,
        }));
      }
    }
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

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBillingForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
            const product = item.product || item.pcPart || item.accessory;
            const customBuild = item.customBuild;
            if (customBuild) {
              return {
                id: item._id || customBuild._id || Math.random(),
                type: 'customBuild',
                itemId: customBuild._id,
                name: customBuild.name || 'Custom Build',
                price: item.price || customBuild.total || 0,
                quantity: item.quantity || 1,
                notes: item.notes
              };
            }
            return {
              id: item._id || product?._id || Math.random(),
              type: item.product ? 'product' : item.pcPart ? 'pcPart' : item.accessory ? 'accessory' : 'product',
              itemId: product?._id,
              name: product?.name || 'Item',
              price: item.price || product?.price || 0,
              quantity: item.quantity || 1,
              notes: item.notes
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
    if (cartItems.length > 0 && discountCode && !appliedDiscount && !discountError) {
      // Small timeout to ensure calculateSubtotal has the latest cart items
      const timeoutId = setTimeout(() => {
        handleApplyDiscount();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, discountCode, appliedDiscount, discountError]);

  const getAppliedDiscountAmount = () => {
    if (!appliedDiscount || appliedDiscount.type === 'free_shipping') return 0;
    if (appliedDiscount.type === 'percentage') return calculateSubtotal() * (appliedDiscount.value / 100);
    return Math.min(appliedDiscount.value, calculateSubtotal());
  };

  const calculateTax = () => {
    if (!storeSettings.taxEnabled) return 0;
    const hasSelectedShippingMethod = completedSections.has('shippingMethod') || activeSection === 'donation' || activeSection === 'payment';
    const applicableShipping = hasSelectedShippingMethod ? calculateShipping() : 0;
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
        const hasSelectedShippingMethod = completedSections.has('shippingMethod') || activeSection === 'donation' || activeSection === 'payment';
        const applicableShipping = hasSelectedShippingMethod ? calculateShipping() : 0;
        const applicableInsurance = hasSelectedShippingMethod ? calculateInsurance() : 0;
        const totalBeforeDonation = calculateSubtotal() + calculateTax() + applicableShipping + applicableInsurance;
        return Math.ceil(totalBeforeDonation) - totalBeforeDonation;
      case 'fixed': return 5.00;
      case 'custom': return parseFloat(customDonation) || 0;
      default: return 0;
    }
  };
  const hasSelectedShippingMethod = completedSections.has('shippingMethod') || activeSection === 'donation' || activeSection === 'payment';
  const displayShipping = hasSelectedShippingMethod ? calculateShipping() : 0;
  const displayInsurance = hasSelectedShippingMethod ? calculateInsurance() : 0;
  const hasSelectedDonation = completedSections.has('donation') || activeSection === 'payment';
  const displayDonation = hasSelectedDonation ? calculateDonation() : 0;

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingBilling, setIsProcessingBilling] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | 'affirm'>('paypal');

  const calculateTotal = () => {
    let baseTotal = Math.max(0, calculateSubtotal() + calculateTax() + displayShipping + displayInsurance + displayDonation - customDiscountAmount - getAppliedDiscountAmount());
    if (selectedPaymentMethod === 'affirm') {
      baseTotal = baseTotal * 1.0699; // Add 6.99% surcharge silently
    }
    return baseTotal;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleAffirmApprove = () => {
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

    // Store cart data so we can access it on the success redirect
    localStorage.setItem('affirmPendingOrder', JSON.stringify({
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
      shippingAmount: calculateShipping(),
      shippingInsurance: calculateInsurance(),
      shippingRates: shippoRates,
      selectedShippingRate: shippoRates.find(r => r.objectId === shippingMethod) || null,
      donationCause: selectedCauseId || undefined,
      donationAmount: calculateDonation(),
      totalAmount: calculateTotal(),
    }));

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
        user_cancel_url: `${window.location.origin}/checkout`,
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
        shipping_type: isGround ? "Ground" : "Expedited"
      },
      order_id: `LANForge_${Date.now()}`,
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
      onSuccess: async (data: any) => {
         // Affirm calls user_confirmation_url on success, but just in case we can also process it here if it's set to not redirect.
         // Wait for redirect to handle order processing
      }
    });
  };

  React.useEffect(() => {
    // Check if we came back from Affirm success redirect
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes('/checkout') && params.get('payment_method') === 'affirm' && params.get('charge_id')) {
      const storedOrder = localStorage.getItem('affirmPendingOrder');
      if (storedOrder) {
        setIsProcessing(true);
        setActiveSection('payment');
        const orderPayload = JSON.parse(storedOrder);
        const chargeId = params.get('charge_id');
        
        // Remove it immediately to avoid duplicates on refresh
        localStorage.removeItem('affirmPendingOrder');

        fetch(`${process.env.REACT_APP_API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        })
        .then(res => {
          if (!res.ok) throw new Error('Order creation failed');
          return res.json();
        })
        .then(orderData => {
          if (orderData && orderData.order) {
            // Log the payment
            return fetch(`${process.env.REACT_APP_API_URL}/payments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: orderPayload.totalAmount,
                currency: 'usd',
                paymentMethod: 'affirm',
                gatewayTransactionId: chargeId,
                orderId: orderData.order._id,
                customerId: orderData.order.customer,
                status: 'completed'
              })
            }).then(() => {
              // Clear cart
              const sessionId = localStorage.getItem('cartSessionId');
              if (sessionId) {
                return fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ items: [], clearDiscount: true })
                });
              }
            }).then(() => {
              navigate(`/order-status?id=${orderData.order._id}`);
            });
          }
        })
        .catch(err => {
          console.error("Error finalizing Affirm order:", err);
          setPaymentError("There was an error finalizing your order. Please contact support.");
          setIsProcessing(false);
        });
      }
    }
  }, [navigate]);

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
        } else {
          setErrorMsg('No shipping methods available for this address.');
        }
      } else {
        setErrorMsg('Failed to calculate shipping rates.');
      }
    } catch (error) {
      console.error('Failed to fetch rates', error);
    } finally {
      setIsFetchingRates(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleSectionComplete = async (section: string) => {
    setErrorMsg('');
    // Validate required fields before proceeding
    if (section === 'shipping') {
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
      const isComplete = requiredFields.every(field => shippingForm[field as keyof typeof shippingForm]);
      if (!isComplete) {
        setErrorMsg('Please fill in all required shipping fields.');
        return;
      }
      // Fetch rates in background when shipping address is complete
      fetchShippoRates();
    } else if (section === 'billing') {
      if (!useSameAddress) {
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
        const isComplete = requiredFields.every(field => billingForm[field as keyof typeof billingForm]);
        if (!isComplete) {
          setErrorMsg('Please fill in all required billing fields.');
          return;
        }
      }
      
      setIsProcessingBilling(true);
      // We completed the billing step, so let's hit our checkout-init endpoint
      try {
        const custRes = await fetch(`${process.env.REACT_APP_API_URL}/customers/checkout-init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingAddress: shippingForm,
            billingAddress: useSameAddress ? shippingForm : billingForm
          })
        });
        const custData = await custRes.json();
        if (custData && custData.customer && custData.customer._id) {
          setCustomerId(custData.customer._id);
        }
      } catch (err) {
        console.error('Failed to init customer or update intent', err);
      } finally {
        setIsProcessingBilling(false);
      }
    } else if (section === 'shippingMethod') {
      if (shippoRates.length === 0) {
        setErrorMsg('No valid shipping methods available. Please verify your address.');
        return;
      }
      if (!shippingMethod) {
        setErrorMsg('Please select a shipping method.');
        return;
      }
    } else if (section === 'donation') {
      if (donationOption === 'custom' && (!customDonation || isNaN(parseFloat(customDonation)) || parseFloat(customDonation) <= 0)) {
        setErrorMsg('Please enter a valid custom donation amount.');
        return;
      }
    }

    setCompletedSections(prev => new Set(prev).add(section));
    const sections: ('shipping' | 'billing' | 'shippingMethod' | 'donation' | 'payment')[] = ['shipping', 'billing', 'shippingMethod', 'donation', 'payment'];
    const currentIndex = sections.indexOf(activeSection);
    
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
    }
  };

  const handleEditSection = (section: string) => {
    setActiveSection(section as any);
  };

  const isSectionCompleted = (section: string) => completedSections.has(section);
  const isSectionActive = (section: string) => activeSection === section;

  return (
    <div className="checkout-page relative">
      <div className="container">
        <Link 
          to="/cart" 
          className="absolute left-4 top-4 md:left-8 md:top-8 text-sm font-medium text-gray-400 hover:text-emerald-400 transition-colors z-10"
        >
          ← Back to Cart
        </Link>
        <motion.div className="checkout-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1>Checkout</h1>
        </motion.div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-progress">
            {['shipping', 'billing', 'shippingMethod', 'donation', 'payment'].map((section, index) => (
              <div 
                key={section} 
                className={`progress-step ${isSectionCompleted(section) ? 'clickable' : ''}`}
                onClick={() => {
                  if (isSectionCompleted(section)) handleEditSection(section);
                }}
              >
                <div className={`step-indicator ${isSectionCompleted(section) ? 'completed' : ''} ${isSectionActive(section) ? 'active' : ''}`}>
                  {isSectionCompleted(section) ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
                </div>
                <div className="step-info">
                  <span className="step-title">
                    {section === 'shipping' && 'Shipping'}
                    {section === 'billing' && 'Billing'}
                    {section === 'shippingMethod' && 'Shipping'}
                    {section === 'donation' && 'Donation'}
                    {section === 'payment' && 'Payment'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-layout">
            <div className="checkout-forms">
              {isSectionActive('shipping') && (
                <motion.div className="checkout-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <div className="section-header">
                    <h2>Shipping Address</h2>
                    <button type="button" className="btn btn-outline btn-small" onClick={() => handleSectionComplete('shipping')}>Continue</button>
                  </div>
                  {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">{errorMsg}</div>}
                  <div className="form-grid">
                    <div className="form-group"><label>First Name *</label><input type="text" name="firstName" value={shippingForm.firstName} onChange={handleShippingChange} required /></div>
                    <div className="form-group"><label>Last Name *</label><input type="text" name="lastName" value={shippingForm.lastName} onChange={handleShippingChange} required /></div>
                    <div className="form-group"><label>Email *</label><input type="email" name="email" value={shippingForm.email} onChange={handleShippingChange} required /></div>
                    <div className="form-group"><label>Phone *</label><input type="tel" name="phone" value={shippingForm.phone} onChange={handleShippingChange} required /></div>
                    <div className="form-group col-span-2">
                      <label>Address *</label>
                      {isLoaded ? (
                        <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
                          <input type="text" name="address" value={shippingForm.address} onChange={handleShippingChange} required placeholder="Start typing your address..." style={{ width: '100%' }} />
                        </Autocomplete>
                      ) : (
                        <input type="text" name="address" value={shippingForm.address} onChange={handleShippingChange} required style={{ width: '100%' }} />
                      )}
                    </div>
                    <div className="form-group"><label>Apartment, suite, etc.</label><input type="text" name="apartment" value={shippingForm.apartment} onChange={handleShippingChange} /></div>
                    <div className="form-group"><label>City *</label><input type="text" name="city" value={shippingForm.city} onChange={handleShippingChange} required /></div>
                    <div className="form-group"><label>State *</label><input type="text" name="state" value={shippingForm.state} onChange={handleShippingChange} required /></div>
                    <div className="form-group"><label>ZIP Code *</label><input type="text" name="zip" value={shippingForm.zip} onChange={handleShippingChange} required /></div>
                    <div className="form-group"><label>Country *</label><select name="country" value={shippingForm.country} onChange={handleShippingChange} required><option value="US">United States</option><option value="CA">Canada</option></select></div>
                  </div>
                </motion.div>
              )}

              {isSectionActive('billing') && (
                <motion.div className="checkout-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <div className="section-header">
                    <h2>Billing Address</h2>
                    <button type="button" className="btn btn-outline btn-small flex items-center gap-2" onClick={() => handleSectionComplete('billing')} disabled={isProcessingBilling}>
                      {isProcessingBilling ? (
                        <>
                          <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </button>
                  </div>
                  {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">{errorMsg}</div>}
                  <div className="checkbox-label mb-4">
                    <input type="checkbox" checked={useSameAddress} onChange={(e) => setUseSameAddress(e.target.checked)} />
                    Same as shipping address
                  </div>
                  {!useSameAddress && (
                    <div className="form-grid">
                      <div className="form-group"><label>First Name *</label><input type="text" name="firstName" value={billingForm.firstName} onChange={handleBillingChange} required /></div>
                      <div className="form-group"><label>Last Name *</label><input type="text" name="lastName" value={billingForm.lastName} onChange={handleBillingChange} required /></div>
                      <div className="form-group"><label>Email *</label><input type="email" name="email" value={billingForm.email} onChange={handleBillingChange} required /></div>
                      <div className="form-group"><label>Phone *</label><input type="tel" name="phone" value={billingForm.phone} onChange={handleBillingChange} required /></div>
                      <div className="form-group col-span-2"><label>Address *</label><input type="text" name="address" value={billingForm.address} onChange={handleBillingChange} required style={{ width: '100%' }} /></div>
                      <div className="form-group"><label>Apartment, suite, etc.</label><input type="text" name="apartment" value={billingForm.apartment} onChange={handleBillingChange} /></div>
                      <div className="form-group"><label>City *</label><input type="text" name="city" value={billingForm.city} onChange={handleBillingChange} required /></div>
                      <div className="form-group"><label>State *</label><input type="text" name="state" value={billingForm.state} onChange={handleBillingChange} required /></div>
                      <div className="form-group"><label>ZIP Code *</label><input type="text" name="zip" value={billingForm.zip} onChange={handleBillingChange} required /></div>
                      <div className="form-group"><label>Country *</label><select name="country" value={billingForm.country} onChange={handleBillingChange} required><option value="US">United States</option><option value="CA">Canada</option></select></div>
                    </div>
                  )}
                </motion.div>
              )}

              {isSectionActive('shippingMethod') && (
                <motion.div className="checkout-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <div className="section-header">
                    <h2>Shipping Method</h2>
                    <button type="button" className="btn btn-outline btn-small" onClick={() => handleSectionComplete('shippingMethod')}>Continue</button>
                  </div>
                  {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">{errorMsg}</div>}
                  {isFetchingRates ? (
                    <div className="py-8 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400">Calculating shipping rates...</p>
                    </div>
                  ) : (
                    <div className="shipping-options">
                      {shippoRates.length > 0 ? (
                        shippoRates.map((rate) => {
                          const title = (rate.title || rate.displayName || rate.provider || '').toLowerCase();
                          const isRateGround = title.includes('ground') || title.includes('standard');
                          const isFree = appliedDiscount && appliedDiscount.type === 'free_shipping' && isRateGround;
                          return (
                            <label key={rate.objectId} className={`shipping-option ${shippingMethod === rate.objectId ? 'selected' : ''}`}>
                              <input 
                                type="radio" 
                                name="shippingMethod" 
                                value={rate.objectId} 
                                checked={shippingMethod === rate.objectId} 
                                onChange={(e) => { setShippingMethod(e.target.value); setShippingMethodCost(parseFloat(rate.amount)); }} 
                              />
                              <div className="option-content">
                                <div className="option-header">
                                  <span className="option-title">{rate.title || rate.displayName || `${rate.provider} ${rate.servicelevel?.name}`}</span>
                                  <span className="option-price">{isFree ? 'FREE' : `$${parseFloat(rate.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                                </div>
                                <p className="option-description">Estimated delivery: {rate.estimatedDays || '3-5'} {String(rate.estimatedDays) === '1' ? 'business day' : 'business days'}</p>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <>
                          <label className={`shipping-option ${shippingMethod === 'standard' ? 'selected' : ''}`}>
                            <input type="radio" name="shippingMethod" value="standard" checked={shippingMethod === 'standard'} onChange={(e) => { setShippingMethod(e.target.value); setShippingMethodCost(49.99); }} />
                            <div className="option-content">
                              <div className="option-header"><span className="option-title">Standard Shipping</span><span className="option-price">{appliedDiscount && appliedDiscount.type === 'free_shipping' ? 'FREE' : '$49.99'}</span></div>
                              <p className="option-description">5-7 business days</p>
                            </div>
                          </label>
                          <label className={`shipping-option ${shippingMethod === 'express' ? 'selected' : ''}`}>
                            <input type="radio" name="shippingMethod" value="express" checked={shippingMethod === 'express'} onChange={(e) => { setShippingMethod(e.target.value); setShippingMethodCost(79.99); }} />
                            <div className="option-content">
                              <div className="option-header"><span className="option-title">Express Shipping</span><span className="option-price">$79.99</span></div>
                              <p className="option-description">2-3 business days</p>
                            </div>
                          </label>
                          <label className={`shipping-option ${shippingMethod === 'overnight' ? 'selected' : ''}`}>
                            <input type="radio" name="shippingMethod" value="overnight" checked={shippingMethod === 'overnight'} onChange={(e) => { setShippingMethod(e.target.value); setShippingMethodCost(129.99); }} />
                            <div className="option-content">
                              <div className="option-header"><span className="option-title">Overnight Shipping</span><span className="option-price">$129.99</span></div>
                              <p className="option-description">Next business day</p>
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                  )}
                  <label className="checkbox-label insurance-checkbox mb-4">
                    <input type="checkbox" checked={shippingInsurance || (appliedDiscount && appliedDiscount.type === 'free_shipping')} disabled={appliedDiscount && appliedDiscount.type === 'free_shipping'} onChange={(e) => setShippingInsurance(e.target.checked)} />
                    <div><span className="checkbox-title">Add Shipping Insurance</span><span className="checkbox-price">{appliedDiscount && appliedDiscount.type === 'free_shipping' ? 'FREE' : `+ $${(Math.max(0, calculateSubtotal() - customDiscountAmount + calculateShipping()) * 0.0125).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span><p className="checkbox-description">Protect your order during shipping</p></div>
                  </label>
                  
                  <div className="mt-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg text-xs text-gray-400">
                    <span className="text-emerald-400 font-semibold">Note:</span> Estimated delivery timeline starts <em>after</em> LANForge has processed and shipped your order.
                  </div>
                </motion.div>
              )}

              {isSectionActive('donation') && (
                <motion.div className="checkout-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <div className="section-header">
                    <h2>Optional: Support a Cause</h2>
                    <button type="button" className="btn btn-outline btn-small" onClick={() => handleSectionComplete('donation')}>Skip</button>
                  </div>
                  {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">{errorMsg}</div>}
                  <div className="donation-content">
                    {activeCauses.length > 0 ? (
                      <>
                        <p className="donation-description">Select a cause to support. LANForge contributes to these initiatives with every PC purchased!</p>
                        <div className="causes-list mb-6">
                          {activeCauses.map(cause => (
                            <label key={cause._id} className={`shipping-option ${selectedCauseId === cause._id ? 'selected' : ''}`}>
                              <input 
                                type="radio" 
                                name="selectedCause" 
                                value={cause._id} 
                                checked={selectedCauseId === cause._id} 
                                onChange={(e) => setSelectedCauseId(e.target.value)} 
                              />
                              <div className="option-content flex items-center gap-4">
                                {cause.imageUrl && <img src={cause.imageUrl} alt={cause.name} className="w-16 h-16 object-contain rounded bg-white p-1" />}
                                <div>
                                  <div className="option-title">{cause.name}</div>
                                  <p className="text-sm text-gray-400">{cause.description}</p>
                                  <p className="text-xs text-emerald-400 mt-1">LANForge donates ${cause.lanforgeContributionPerPC} per PC ordered!</p>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="donation-image">
                          <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" alt="Gaming Education Initiative" />
                          <div className="image-caption">Supporting the next generation of gamers</div>
                        </div>
                        <p className="donation-description">LANForge contributes to gaming education initiatives with every purchase. Your donation helps provide gaming equipment and educational resources to underserved communities.</p>
                      </>
                    )}
                    
                    <h3 className="text-lg font-medium text-white mb-3 mt-4">Add your own contribution</h3>
                    <div className="donation-options">
                      <label className={`donation-option ${donationOption === 'none' ? 'selected' : ''}`}>
                        <input type="radio" name="donationOption" value="none" checked={donationOption === 'none'} onChange={(e) => setDonationOption(e.target.value as any)} />
                        <span className="option-title">No additional donation</span>
                      </label>
                      <label className={`donation-option ${donationOption === 'roundup' ? 'selected' : ''}`}>
                        <input type="radio" name="donationOption" value="roundup" checked={donationOption === 'roundup'} onChange={(e) => setDonationOption(e.target.value as any)} />
                        <span className="option-title">Round up to nearest dollar</span>
                      </label>
                      <label className={`donation-option ${donationOption === 'fixed' ? 'selected' : ''}`}>
                        <input type="radio" name="donationOption" value="fixed" checked={donationOption === 'fixed'} onChange={(e) => setDonationOption(e.target.value as any)} />
                        <span className="option-title">Add $5 donation</span>
                      </label>
                      <label className={`donation-option ${donationOption === 'custom' ? 'selected' : ''}`}>
                        <input type="radio" name="donationOption" value="custom" checked={donationOption === 'custom'} onChange={(e) => setDonationOption(e.target.value as any)} />
                        <span className="option-title">Custom amount</span>
                        <div className="custom-donation-input"><span>$</span><input type="number" min="0" step="0.01" value={customDonation} onChange={(e) => setCustomDonation(e.target.value)} placeholder="10.00" disabled={donationOption !== 'custom'} /></div>
                      </label>
                    </div>
                    {donationOption !== 'none' && (
                      <div className="donation-action">
                        <button type="button" className="btn btn-outline btn-small" onClick={() => handleSectionComplete('donation')}>Continue with ${calculateDonation().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} donation</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {isSectionActive('payment') && (
                <motion.div className="checkout-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                  <div className="section-header">
                    <h2>Payment Information</h2>
                  </div>
                  
                  <div className="payment-method-selector mb-6 flex gap-4">
                    <label className={`shipping-option flex-1 ${selectedPaymentMethod === 'paypal' ? 'selected border-emerald-500' : 'border-gray-700'} border p-4 rounded cursor-pointer`}>
                      <input type="radio" name="paymentMethod" value="paypal" checked={selectedPaymentMethod === 'paypal'} onChange={() => setSelectedPaymentMethod('paypal')} className="hidden" />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border ${selectedPaymentMethod === 'paypal' ? 'border-4 border-emerald-500' : 'border-gray-500'}`}></div>
                        <span className="font-medium text-white">PayPal</span>
                      </div>
                    </label>
                    <label className={`shipping-option flex-1 ${selectedPaymentMethod === 'affirm' ? 'selected border-emerald-500' : 'border-gray-700'} border p-4 rounded cursor-pointer`}>
                      <input type="radio" name="paymentMethod" value="affirm" checked={selectedPaymentMethod === 'affirm'} onChange={() => setSelectedPaymentMethod('affirm')} className="hidden" />
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border ${selectedPaymentMethod === 'affirm' ? 'border-4 border-emerald-500' : 'border-gray-500'}`}></div>
                        <span className="font-medium text-white">Affirm</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-7">Pay over time</p>
                    </label>
                  </div>
                  
                  {selectedPaymentMethod === 'affirm' && (
                    <div className="mb-4 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 p-3 rounded flex items-start gap-2">
                      <FontAwesomeIcon icon={faShieldHalved} className="mt-0.5" />
                      <p><strong>Note:</strong> Pricing for PCs purchased using PayPal receives a discount. Checking out with Affirm prevents you from receiving PayPal payment discounts.</p>
                    </div>
                  )}

                  {selectedPaymentMethod === 'paypal' ? (
                  <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <label className="block text-sm font-medium text-gray-300 mb-4">Complete your payment securely with PayPal</label>
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
                              phone_number: {
                                national_number: payerPhone
                              }
                            };
                          }

                          return actions.order.create({
                            intent: 'CAPTURE',
                            payer: Object.keys(payer).length > 0 ? payer : undefined,
                            purchase_units: [{
                              amount: {
                                currency_code: 'USD',
                                value: total
                              }
                            }],
                            application_context: {
                              shipping_preference: 'NO_SHIPPING'
                            }
                          });
                        }}
                        onApprove={handlePayPalApprove}
                      />
                    </PayPalScriptProvider>
                    {paymentError && <div className="text-red-500 text-sm mt-4">{paymentError}</div>}
                  </div>
                  ) : (
                  <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 flex flex-col items-center">
                    <img src="https://cdn-assets.affirm.com/images/blue_logo-transparent_bg.png" alt="Affirm" className="h-8 mb-4 object-contain" />
                    <p className="text-center text-gray-700 text-sm mb-6 max-w-md">You will be redirected to Affirm to securely complete your purchase. Pay over time with flexible monthly payments.</p>
                    <button type="button" className="btn bg-blue-600 hover:bg-blue-700 text-white border-none w-full max-w-xs py-3 rounded font-medium transition-colors" onClick={handleAffirmApprove} disabled={isProcessing}>
                      {isProcessing ? 'Processing...' : 'Checkout with Affirm'}
                    </button>
                    {paymentError && <div className="text-red-500 text-sm mt-4">{paymentError}</div>}
                  </div>
                  )}
                  <div className="payment-security"><span className="security-icon"><FontAwesomeIcon icon={faLock} /></span><span>Your payment information is encrypted and secure</span></div>
                </motion.div>
              )}
            </div>

            <motion.div className="checkout-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <h2>Order Summary</h2>
              <div className="order-items">
                <h3>Items ({cartItems.length})</h3>
                {cartItems.map((item) => (
                  <div key={item.id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      {item.notes && <span className="text-xs text-emerald-400 block mt-0.5">{item.notes}</span>}
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className="discount-section">
                <h3>Discount Code</h3>
                <div className="discount-input">
                  <input type="text" placeholder="Enter discount code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
                  <button type="button" className="btn btn-outline" onClick={handleApplyDiscount}>Apply</button>
                </div>
                {discountError && <p className="text-red-500 text-xs mt-2">{discountError}</p>}
                {appliedDiscount && (
                  <div className="mt-2 text-emerald-400 text-sm flex justify-between items-center">
                    <span>Discount '{appliedDiscount.code}' applied!</span>
                    <button type="button" className="text-gray-400 hover:text-white" onClick={() => { 
                      setAppliedDiscount(null); 
                      setDiscountCode(''); 
                      localStorage.removeItem('autoDiscountCode');
                    }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="order-totals">
                <div className="total-row"><span>Subtotal</span><span>${calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                {hasSelectedShippingMethod && (
                  <>
                    <div className="total-row">
                      <span>Shipping</span>
                      <span>
                        {calculateShipping() === 0 && appliedDiscount && appliedDiscount.type === 'free_shipping' 
                          ? 'FREE' 
                          : `$${calculateShipping().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    <div className="total-row"><span>Shipping Insurance</span><span>{calculateInsurance() === 0 && appliedDiscount && appliedDiscount.type === 'free_shipping' ? 'FREE' : `$${calculateInsurance().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span></div>
                  </>
                )}
              {storeSettings.taxEnabled && storeSettings.taxRate > 0 && (
                <div className="total-row"><span>Tax ({storeSettings.taxRate}%)</span><span>${calculateTax().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              )}
              {hasSelectedDonation && displayDonation > 0 && (
                <div className="total-row donation-row"><span>Your Donation</span><span>${displayDonation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              )}
              {appliedDiscount && appliedDiscount.type !== 'free_shipping' && (
                <div className="total-row text-emerald-400">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>-${(appliedDiscount.type === 'percentage' ? calculateSubtotal() * (appliedDiscount.value / 100) : Math.min(appliedDiscount.value, calculateSubtotal())).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {appliedDiscount && appliedDiscount.type === 'free_shipping' && (
                <div className="total-row text-emerald-400">
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
                       return isGround ? 'Free Ground Shipping' : 'Valid on Ground Only';
                    })()}
                  </span>
                </div>
              )}
              {customDiscountAmount > 0 && (
                <div className="total-row text-emerald-400"><span>Custom Discount</span><span>-${customDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              )}
              <div className="total-row grand-total"><span>Total</span><span>${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              </div>
              {activeSection === 'payment' && isProcessing && (
                <div className="py-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-emerald-400 font-medium">Processing your payment...</p>
                  <p className="text-gray-400 text-sm mt-1">Please do not close or refresh this page.</p>
                </div>
              )}
            </motion.div>
          </div>
        </form>

        <div className="mt-12 text-center text-gray-500 text-xs flex flex-row flex-wrap justify-center items-center gap-2 border-t border-gray-800 pt-6 pb-6">
          <div className="flex items-center gap-1"><FontAwesomeIcon icon={faLock} className="text-emerald-500" /> <span>256-bit SSL Encryption</span></div>
          <div className="text-gray-700">•</div>
          <div className="flex items-center gap-1"><FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" /> <span>PCI DSS Compliant</span></div>
          <div className="text-gray-700">•</div>
          <div>&copy; {new Date().getFullYear()} LANForge, LLC.</div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

