import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Intercom from '@intercom/messenger-js-sdk';
import api from './utils/api';
import { usePageTracking } from './utils/analytics';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import AnnouncementBar from './components/AnnouncementBar';
import PromoPopup from './components/PromoPopup';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import ProductsPage from './pages/ProductsPage';
import PCsPage from './pages/PCsPage';
import WarrantyPage from './pages/WarrantyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import ContactPage from './pages/ContactPage';
import ShowcasePage from './pages/ShowcasePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import ShipmentTrackingPage from './pages/ShipmentTrackingPage';
import CustomBuildPage from './pages/CustomBuildPage';
import InvoicePage from './pages/InvoicePage';
import DignitasPage from './pages/DignitasPage';
import TradeifyPage from './pages/TradeifyPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AccessoriesPage from './pages/AccessoriesPage';
import MerchPage from './pages/MerchPage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import ReviewsPage from './pages/ReviewsPage';
import PressPage from './pages/PressPage';
import FAQPage from './pages/FAQPage';
import TechSupportPage from './pages/TechSupportPage';
import PCServicesPage from './pages/PCServicesPage';
import PartnersPage from './pages/PartnersPage';
import AffiliateApplicationPage from './pages/AffiliateApplicationPage';
import DiscountRedirectPage from './pages/DiscountRedirectPage';
import TradeInPage from './pages/TradeInPage';
import GiftCardPage from './pages/GiftCardPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminOrderDetailsPage from './pages/AdminOrderDetailsPage';
import AdminPaymentDetailsPage from './pages/AdminPaymentDetailsPage';
import AdminPurchasedPCDetailsPage from './pages/AdminPurchasedPCDetailsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminAddProductPage from './pages/AdminAddProductPage';
import AdminInventoryPage from './pages/AdminInventoryPage';
import AdminPartsPage from './pages/AdminPartsPage';
import AdminAddPartPage from './pages/AdminAddPartPage';
import AdminCustomersPage from './pages/AdminCustomersPage';
import AdminCustomerDetailsPage from './pages/AdminCustomerDetailsPage';
import AdminAddCustomerPage from './pages/AdminAddCustomerPage';
import AdminAddOrderPage from './pages/AdminAddOrderPage';
import AdminPromotionsPage from './pages/AdminPromotionsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminPartnersPage from './pages/AdminPartnersPage';
import AdminPartnerDetailsPage from './pages/AdminPartnerDetailsPage';
import AdminCartsPage from './pages/AdminCartsPage';
import AdminCustomBuildsPage from './pages/AdminCustomBuildsPage';
import AdminCustomBuildDetailsPage from './pages/AdminCustomBuildDetailsPage';
import AdminBuildRequestsPage from './pages/AdminBuildRequestsPage';
import AdminBuildRequestDetailsPage from './pages/AdminBuildRequestDetailsPage';
import AdminShowcasesPage from './pages/AdminShowcasesPage';
import AdminShowcaseDetailsPage from './pages/AdminShowcaseDetailsPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import AdminInvoicesPage from './pages/AdminInvoicesPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSessionDetailsPage from './pages/AdminSessionDetailsPage';
import AdminDonationCausesPage from './pages/AdminDonationCausesPage';
import AdminApiLogsPage from './pages/AdminApiLogsPage';
import AdminBundlesPage from './pages/AdminBundlesPage';
import AdminAddBundlePage from './pages/AdminAddBundlePage';
import AdminMerchPage from './pages/AdminMerchPage';
import AdminAddMerchPage from './pages/AdminAddMerchPage';
import AdminOptimizationsPage from './pages/AdminOptimizationsPage';
import AdminAddOptimizationPage from './pages/AdminAddOptimizationPage';
import AdminGiftcardsPage from './pages/AdminGiftcardsPage';
import AdminDelistingsPage from './pages/AdminDelistingsPage';
import AdminTradeInsPage from './pages/AdminTradeInsPage';
import AdminTradeInDetailsPage from './pages/AdminTradeInDetailsPage';
import AdminUsedPartsPage from './pages/AdminUsedPartsPage';


export const PageStatusContext = React.createContext<string[]>([]);

const MaintenancePage = ({ reopenAt }: { reopenAt?: string | Date }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    if (!reopenAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(reopenAt).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
        window.location.reload();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [reopenAt]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <img src="/logo-2.png" alt="LANForge" className="h-16 mx-auto mb-8" />
        <h1 className="text-4xl font-bold text-white">We'll be back soon!</h1>
        <p className="text-gray-400 text-lg">
          We're currently performing some scheduled maintenance.
          Our team is working hard to get everything back up and running.
        </p>
        
        {timeLeft && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mt-8">
            <p className="text-sm font-medium text-emerald-500 uppercase tracking-wider mb-4">Estimated Time Remaining</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                <div className="text-3xl font-bold text-white">{timeLeft.days}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Days</div>
              </div>
              <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                <div className="text-3xl font-bold text-white">{timeLeft.hours}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Hours</div>
              </div>
              <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                <div className="text-3xl font-bold text-white">{timeLeft.minutes}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Mins</div>
              </div>
              <div className="bg-black/50 rounded-lg p-3 border border-gray-800">
                <div className="text-3xl font-bold text-white">{timeLeft.seconds}</div>
                <div className="text-xs text-gray-500 uppercase mt-1">Secs</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              Reopening at: {new Date(reopenAt as string | Date).toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const AppContent = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Global check for discount codes in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const discountCode = searchParams.get('discount') || searchParams.get('ref');
    
    if (discountCode) {
      localStorage.setItem('autoDiscountCode', discountCode);
      
      if (discountCode.toUpperCase() === 'VIPEROUS') {
        fetch(`${process.env.REACT_APP_API_URL}/discounts/notify-visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: discountCode })
        }).catch(err => console.error('Failed to notify visit', err));
      }
    }
  }, [location.search]);
  const [maintenance, setMaintenance] = useState<{enabled: boolean, reopenAt?: Date} | null>(null);
  const [disabledPages, setDisabledPages] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check local storage for token to see if maybe admin
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'staff') {
          setIsAdmin(true);
        }
      } catch (e) {}
    }

    const fetchSettings = async () => {
      try {
        const response = await api.get('/page-status/public');
        if (response.data.pages) {
          const maintenancePage = response.data.pages.find((p: any) => p.path === 'maintenance_mode');
          if (maintenancePage) {
            setMaintenance({ enabled: maintenancePage.enabled, reopenAt: maintenancePage.reopenAt });
          }
          
          const disabled = response.data.pages
            .filter((p: any) => p.path !== 'maintenance_mode' && !p.enabled)
            .map((p: any) => p.path);
          setDisabledPages(disabled);
        }
      } catch (error) {
        console.error('Failed to fetch settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [location.pathname]);

  // auto reopen logic
  useEffect(() => {
    if (maintenance?.enabled && maintenance.reopenAt) {
      const reopenTime = new Date(maintenance.reopenAt as string | Date).getTime();
      const now = new Date().getTime();
      
      if (now >= reopenTime) {
        setMaintenance(null);
      } else {
        const timeUntilReopen = reopenTime - now;
        const timer = setTimeout(() => {
          setMaintenance(null);
        }, timeUntilReopen);
        return () => clearTimeout(timer);
      }
    }
  }, [maintenance]);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Allow admin routes unconditionally
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Maintenance mode block
  if (!isAdmin && maintenance?.enabled) {
    const isPastReopen = maintenance.reopenAt ? new Date().getTime() >= new Date(maintenance.reopenAt as string | Date).getTime() : false;
    if (!isPastReopen) {
      return <MaintenancePage reopenAt={maintenance.reopenAt} />;
    }
  }

  // Disabled page block
  const isPageDisabled = disabledPages.some(page => 
    location.pathname === page || (page !== '/' && location.pathname.startsWith(`${page}/`))
  );

  if (!isAdmin && isPageDisabled) {
    return (
      <PageStatusContext.Provider value={disabledPages}>
        <div className="App">
          <Header />
          <NotFoundPage />
          <Footer />
        </div>
      </PageStatusContext.Provider>
    );
  }

  return (
    <PageStatusContext.Provider value={disabledPages}>
      {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/checkout') && <AnnouncementBar />}
      {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/checkout') && <PromoPopup />}
      {children}
    </PageStatusContext.Provider>
  );
};

function App() {
  // Initialize Intercom on component mount
  useEffect(() => {
    Intercom({
      app_id: 'ngo9fpbi',
    });
  }, []);

  return (
    <Router>
      <AppContent>
        <div className="App">
        <ScrollToTop />
        <ScrollProgress />
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <HomePage />
              <Footer />
            </>
          } />
          <Route path="/configurator" element={
            <>
              <Header />
              <ConfiguratorPage />
              <Footer />
            </>
          } />
          <Route path="/build/:id" element={
            <>
              <Header />
              <CustomBuildPage />
              <Footer />
            </>
          } />
          <Route path="/products" element={
            <>
              <Header />
              <ProductsPage />
              <Footer />
            </>
          } />
          <Route path="/products/:productId" element={
            <>
              <Header />
              <ProductsPage />
              <Footer />
            </>
          } />
          <Route path="/pcs" element={
            <>
              <Header />
              <PCsPage />
              <Footer />
            </>
          } />
          <Route path="/warranty" element={
            <>
              <Header />
              <WarrantyPage />
              <Footer />
            </>
          } />
          <Route path="/terms" element={
            <>
              <Header />
              <TermsOfServicePage />
              <Footer />
            </>
          } />
          <Route path="/privacy" element={
            <>
              <Header />
              <PrivacyPolicyPage />
              <Footer />
            </>
          } />
          <Route path="/contact" element={
            <>
              <Header />
              <ContactPage />
              <Footer />
            </>
          } />
          <Route path="/cart" element={
            <>
              <Header />
              <CartPage />
              <Footer />
            </>
          } />
          <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-status" element={<OrderStatusPage />} />
              <Route path="/track/:orderId" element={<ShipmentTrackingPage />} />
              <Route path="/invoice" element={<InvoicePage />} />
          <Route path="/accessories" element={
            <>
              <Header />
              <AccessoriesPage />
              <Footer />
            </>
          } />
          <Route path="/merch" element={
            <>
              <Header />
              <MerchPage />
              <Footer />
            </>
          } />
          <Route path="/faq" element={
            <>
              <Header />
              <FAQPage />
              <Footer />
            </>
          } />
          <Route path="/shipping" element={
            <>
              <Header />
              <ShippingReturnsPage />
              <Footer />
            </>
          } />
          <Route path="/guides" element={
            <>
              <Header />
              <PlaceholderPage title="Build Guides" description="Step-by-step guides for building your PC" />
              <Footer />
            </>
          } />
          <Route path="/dignitas" element={
            <>
              <Header />
              <DignitasPage />
              <Footer />
            </>
          } />
          <Route path="/tradeify" element={
            <>
              <Header />
              <TradeifyPage />
              <Footer />
            </>
          } />
          <Route path="/about" element={
            <>
              <Header />
              <PlaceholderPage title="About Us" description="Learn more about LANForge" />
              <Footer />
            </>
          } />
          <Route path="/reviews" element={
            <>
              <Header />
              <ReviewsPage />
              <Footer />
            </>
          } />
          <Route path="/careers" element={
            <>
              <Header />
              <PlaceholderPage title="Careers" description="Join the LANForge team" />
              <Footer />
            </>
          } />
          <Route path="/press" element={
            <>
              <Header />
              <PressPage />
              <Footer />
            </>
          } />
          <Route path="/blog" element={
            <>
              <Header />
              <PlaceholderPage title="Blog" description="Latest news and articles" />
              <Footer />
            </>
          } />
          <Route path="/cookies" element={
            <>
              <Header />
              <CookiePolicyPage />
              <Footer />
            </>
          } />
          <Route path="/tech-support" element={
            <>
              <Header />
              <TechSupportPage />
              <Footer />
            </>
          } />
          <Route path="/pc-services" element={
            <>
              <Header />
              <PCServicesPage />
              <Footer />
            </>
          } />
          <Route path="/partners" element={
            <>
              <Header />
              <PartnersPage />
              <Footer />
            </>
          } />
          <Route path="/affiliate-application" element={
            <>
              <Header />
              <AffiliateApplicationPage />
              <Footer />
            </>
          } />
          <Route path="/discount/:code" element={<DiscountRedirectPage />} />
          <Route path="/ref" element={<DiscountRedirectPage />} />
          <Route path="/trade-in" element={
            <>
              <Header />
              <TradeInPage />
              <Footer />
            </>
          } />
          <Route path="/giftcard" element={
            <>
              <Header />
              <GiftCardPage />
              <Footer />
            </>
          } />
          <Route path="/partner/:code" element={
            <>
              <Header />
              <ShowcasePage />
              <Footer />
            </>
          } />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/add" element={<AdminAddOrderPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
            <Route path="/admin/payments/:id" element={<AdminPaymentDetailsPage />} />
            <Route path="/admin/purchased-pcs/:id" element={<AdminPurchasedPCDetailsPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/products/add" element={<AdminAddProductPage />} />
            <Route path="/admin/products/edit/:id" element={<AdminAddProductPage />} />
            <Route path="/admin/parts" element={<AdminPartsPage />} />
            <Route path="/admin/parts/add" element={<AdminAddPartPage />} />
            <Route path="/admin/parts/edit/:id" element={<AdminAddPartPage />} />
            <Route path="/admin/bundles" element={<AdminBundlesPage />} />
            <Route path="/admin/bundles/add" element={<AdminAddBundlePage />} />
            <Route path="/admin/bundles/edit/:id" element={<AdminAddBundlePage />} />
            <Route path="/admin/merch" element={<AdminMerchPage />} />
            <Route path="/admin/merch/add" element={<AdminAddMerchPage />} />
            <Route path="/admin/merch/edit/:id" element={<AdminAddMerchPage />} />
            <Route path="/admin/optimizations" element={<AdminOptimizationsPage />} />
            <Route path="/admin/optimizations/add" element={<AdminAddOptimizationPage />} />
            <Route path="/admin/optimizations/edit/:id" element={<AdminAddOptimizationPage />} />
            <Route path="/admin/inventory" element={<AdminInventoryPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/customers/add" element={<AdminAddCustomerPage />} />
            <Route path="/admin/customers/:id" element={<AdminCustomerDetailsPage />} />
            <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
            <Route path="/admin/giftcards" element={<AdminGiftcardsPage />} />
            <Route path="/admin/partners" element={<AdminPartnersPage />} />
            <Route path="/admin/partners/:id" element={<AdminPartnerDetailsPage />} />
            <Route path="/admin/carts" element={<AdminCartsPage />} />
            <Route path="/admin/custom-builds" element={<AdminCustomBuildsPage />} />
            <Route path="/admin/custom-builds/:id" element={<AdminCustomBuildDetailsPage />} />
            <Route path="/admin/build-requests" element={<AdminBuildRequestsPage />} />
            <Route path="/admin/build-requests/:id" element={<AdminBuildRequestDetailsPage />} />
            <Route path="/admin/showcases" element={<AdminShowcasesPage />} />
            <Route path="/admin/showcases/:id" element={<AdminShowcaseDetailsPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/donation-causes" element={<AdminDonationCausesPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/analytics/session/:id" element={<AdminSessionDetailsPage />} />
            <Route path="/admin/api-logs" element={<AdminApiLogsPage />} />
            <Route path="/admin/delistings" element={<AdminDelistingsPage />} />
            <Route path="/admin/trade-ins" element={<AdminTradeInsPage />} />
            <Route path="/admin/trade-ins/:code" element={<AdminTradeInDetailsPage />} />
            <Route path="/admin/used-parts" element={<AdminUsedPartsPage />} />
          </Route>


          {/* 404 Not Found Route */}
          <Route path="*" element={
            <>
              <Header />
              <NotFoundPage />
              <Footer />
            </>
          } />
        </Routes>
        </div>
      </AppContent>
    </Router>
  );
}

export default App;