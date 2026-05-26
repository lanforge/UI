import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageStatusContext } from '../App';

const Header: React.FC = () => {
  const disabledPages = useContext(PageStatusContext);
  const isEnabled = (path: string) => !disabledPages.some(p => p === path || (p !== '/' && path.startsWith(`${p}/`)));

  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [partnersDropdownOpen, setPartnersDropdownOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-narrow">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img 
                src="/logo-2.png" 
                alt="LANForge" 
                className="h-10 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute -inset-2 bg-gradient-neon rounded-full opacity-0 blur-xl group-hover:opacity-20 transition-opacity duration-300" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {isEnabled('/') && (
              <Link 
                to="/" 
                className="text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium relative group"
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-neon group-hover:w-full transition-all duration-300" />
              </Link>
            )}
            
            {/* Products Dropdown */}
            {(isEnabled('/pcs') || isEnabled('/configurator') || isEnabled('/accessories')) && (
            <div 
              className="relative"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium">
                Products
                <motion.svg 
                  className="w-4 h-4"
                  animate={{ rotate: productsDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              
              <div 
                className="absolute top-full left-0 w-64 dropdown z-50"
                style={{ display: productsDropdownOpen ? 'block' : 'none' }}
                onMouseEnter={() => setProductsDropdownOpen(true)}
                onMouseLeave={() => setProductsDropdownOpen(false)}
              >
                {isEnabled('/pcs') && (
                  <Link to="/pcs" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    PCs
                  </Link>
                )}
                {isEnabled('/configurator') && (
                  <Link to="/configurator" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Custom PC
                  </Link>
                )}
                {isEnabled('/accessories') && (
                  <Link to="/accessories" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Accessories
                  </Link>
                )}
              </div>
            </div>
            )}

            {isEnabled('/configurator') && (
              <Link 
                to="/configurator" 
                className="text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium relative group"
              >
                Configurator
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-neon group-hover:w-full transition-all duration-300" />
              </Link>
            )}

            {/* Partners Dropdown */}
            {(isEnabled('/partners') || isEnabled('/press') || isEnabled('/affiliate-application')) && (
            <div 
              className="relative"
              onMouseEnter={() => setPartnersDropdownOpen(true)}
              onMouseLeave={() => setPartnersDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium">
                Partners
                <motion.svg 
                  className="w-4 h-4"
                  animate={{ rotate: partnersDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              
              <div 
                className="absolute top-full left-0 w-64 dropdown z-50"
                style={{ display: partnersDropdownOpen ? 'block' : 'none' }}
                onMouseEnter={() => setPartnersDropdownOpen(true)}
                onMouseLeave={() => setPartnersDropdownOpen(false)}
              >
                {isEnabled('/partners') && (
                  <Link to="/partners" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Our Partners
                  </Link>
                )}
                {isEnabled('/press') && (
                  <Link to="/press" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Press & Media
                  </Link>
                )}
                {isEnabled('/affiliate-application') && (
                  <Link to="/affiliate-application" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Affiliate Application
                  </Link>
                )}
              </div>
            </div>
            )}

            {/* Support Dropdown */}
            {(isEnabled('/contact') || isEnabled('/tech-support') || isEnabled('/pc-services')) && (
            <div 
              className="relative"
              onMouseEnter={() => setSupportDropdownOpen(true)}
              onMouseLeave={() => setSupportDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium">
                Support
                <motion.svg 
                  className="w-4 h-4"
                  animate={{ rotate: supportDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              
              <div 
                className="absolute top-full left-0 w-64 dropdown z-50"
                style={{ display: supportDropdownOpen ? 'block' : 'none' }}
                onMouseEnter={() => setSupportDropdownOpen(true)}
                onMouseLeave={() => setSupportDropdownOpen(false)}
              >
                {isEnabled('/contact') && (
                  <Link to="/contact" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact
                  </Link>
                )}
                {isEnabled('/tech-support') && (
                  <Link to="/tech-support" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Tech Support
                  </Link>
                )}
                {isEnabled('/pc-services') && (
                  <Link to="/pc-services" className="dropdown-item">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    PC Services
                  </Link>
                )}
              </div>
            </div>
            )}

            {isEnabled('/faq') && (
              <Link 
                to="/faq" 
                className="text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium relative group"
              >
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-neon group-hover:w-full transition-all duration-300" />
              </Link>
            )}
            {isEnabled('/warranty') && (
              <Link 
                to="/warranty" 
                className="text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium relative group"
              >
                Warranty
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-neon group-hover:w-full transition-all duration-300" />
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isEnabled('/cart') && (
            <Link to="/cart" className="relative">
              <button className="inline-flex items-center justify-center p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all duration-300 ease-out cursor-pointer min-w-[44px] min-h-[44px]">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </Link>
            )}
            
            {isEnabled('/configurator') && (
            <Link to="/configurator" className="hidden sm:block">
              <button className="btn btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Build Your PC
              </button>
            </Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all duration-300 min-w-[44px] min-h-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="lg:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="py-4 sm:py-6 border-t border-gray-800/50">
                <div className="space-y-2">
                  {isEnabled('/') && (
                    <Link 
                      to="/" 
                      className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                  )}
                  
                  {(isEnabled('/pcs') || isEnabled('/configurator') || isEnabled('/accessories')) && (
                  <div className="space-y-2">
                    <button 
                      className="w-full flex items-center justify-between py-2 text-text-secondary font-medium hover:text-accent-neon transition-colors duration-300"
                      onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                    >
                      <span>Products</span>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={productsDropdownOpen ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                      </svg>
                    </button>
                    {productsDropdownOpen && (
                      <div className="pl-4 space-y-2">
                        {isEnabled('/pcs') && (
                          <Link 
                            to="/pcs" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            PCs
                          </Link>
                        )}
                        {isEnabled('/configurator') && (
                          <Link 
                            to="/configurator" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Custom PC
                          </Link>
                        )}
                        {isEnabled('/accessories') && (
                          <Link 
                            to="/accessories" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Accessories
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {isEnabled('/configurator') && (
                    <Link 
                      to="/configurator" 
                      className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Configurator
                    </Link>
                  )}

                  {(isEnabled('/partners') || isEnabled('/press') || isEnabled('/affiliate-application')) && (
                  <div className="space-y-2">
                    <button 
                      className="w-full flex items-center justify-between py-2 text-text-secondary font-medium hover:text-accent-neon transition-colors duration-300"
                      onClick={() => setPartnersDropdownOpen(!partnersDropdownOpen)}
                    >
                      <span>Partners</span>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={partnersDropdownOpen ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                      </svg>
                    </button>
                    {partnersDropdownOpen && (
                      <div className="pl-4 space-y-2">
                        {isEnabled('/partners') && (
                          <Link 
                            to="/partners" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Our Partners
                          </Link>
                        )}
                        {isEnabled('/press') && (
                          <Link 
                            to="/press" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Press & Media
                          </Link>
                        )}
                        {isEnabled('/affiliate-application') && (
                          <Link 
                            to="/affiliate-application" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Affiliate Application
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {(isEnabled('/contact') || isEnabled('/tech-support') || isEnabled('/pc-services')) && (
                  <div className="space-y-2">
                    <button 
                      className="w-full flex items-center justify-between py-2 text-text-secondary font-medium hover:text-accent-neon transition-colors duration-300"
                      onClick={() => setSupportDropdownOpen(!supportDropdownOpen)}
                    >
                      <span>Support</span>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={supportDropdownOpen ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                      </svg>
                    </button>
                    {supportDropdownOpen && (
                      <div className="pl-4 space-y-2">
                        {isEnabled('/contact') && (
                          <Link 
                            to="/contact" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Contact
                          </Link>
                        )}
                        {isEnabled('/tech-support') && (
                          <Link 
                            to="/tech-support" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Tech Support
                          </Link>
                        )}
                        {isEnabled('/pc-services') && (
                          <Link 
                            to="/pc-services" 
                            className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            PC Services
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {isEnabled('/faq') && (
                    <Link 
                      to="/faq" 
                      className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      FAQ
                    </Link>
                  )}
                  {isEnabled('/warranty') && (
                    <Link 
                      to="/warranty" 
                      className="block py-2 text-text-secondary hover:text-accent-neon transition-colors duration-300 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Warranty
                    </Link>
                  )}

                  {isEnabled('/configurator') && (
                  <div className="pt-4">
                    <Link 
                      to="/configurator" 
                      className="btn btn-primary w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Build Your PC
                    </Link>
                  </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
