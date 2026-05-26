import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const DiscountRedirectPage = () => {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let finalCode = code;

    // Handle /ref?{code} or /ref?code={code}
    if (!finalCode && location.pathname === '/ref') {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.has('code')) {
        finalCode = searchParams.get('code') || undefined;
      } else {
        // Fallback for /ref?CODE format
        finalCode = decodeURIComponent(location.search.substring(1));
      }
    }

    if (finalCode) {
      localStorage.setItem('autoDiscountCode', finalCode);
      
      // Notify backend if the discount code is VIPEROUS
      if (finalCode.toUpperCase() === 'VIPEROUS') {
        fetch(`${process.env.REACT_APP_API_URL}/discounts/notify-visit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code: finalCode })
        }).catch(err => console.error('Failed to notify visit', err));
      }
    }

    // Redirect to home page
    navigate('/', { replace: true });
  }, [code, location, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default DiscountRedirectPage;