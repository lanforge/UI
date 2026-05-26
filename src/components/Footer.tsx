import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { PageStatusContext } from '../App';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faDiscord, faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';

const Footer: React.FC = () => {
  const disabledPages = useContext(PageStatusContext);
  const isEnabled = (path: string) => !disabledPages.some(p => p === path || (p !== '/' && path.startsWith(`${p}/`)));

  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setMessage('');
    try {
      const response = await api.post('/newsletter/subscribe', { email, source: 'footer' });
      setStatus('success');
      setMessage(response.data.message || 'Successfully subscribed!');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to subscribe');
    }
  };

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await api.get('/business/public');
        if (response.data.businessInfo) {
          setBusinessInfo(response.data.businessInfo);
        }
      } catch (err) {
        console.error('Failed to fetch business info:', err);
      }
    };
    fetchBusinessInfo();
  }, []);

  const footerColumns = [
    {
      title: 'Products',
      links: [
        { name: 'Pre‑built PCs', path: '/products' },
        { name: 'Custom Configurator', path: '/configurator' },
      ].filter(link => isEnabled(link.path))
    },
    {
      title: 'Support',
      links: [
        { name: 'Contact Us', path: '/contact' },
        { name: 'FAQ', path: '/faq' },
        { name: 'Warranty', path: '/warranty' },
        { name: 'Shipping & Returns', path: '/shipping' },
        { name: 'Build Guides', path: '/guides' }
      ].filter(link => isEnabled(link.path))
    },
    {
      title: 'Company',
      links: [
        { name: 'Reviews', path: '/reviews' },
        { name: 'Careers', path: '/careers' },
        { name: 'Press', path: '/press' },
        { name: 'Blog', path: '/blog' },
        { name: 'Dignitas Partnership', path: '/dignitas' },
        { name: 'Tradeify Partnership', path: '/tradeify' }
      ].filter(link => isEnabled(link.path))
    }
  ].filter(col => col.links.length > 0);

  const socialLinks = [
    { icon: faTwitter, label: 'Twitter', url: 'https://twitter.com/lanforge' }
  ];

  return (
    <footer className="bg-gray-950 border-t border-gray-800/50">
      <div className="w-full px-4 sm:px-6 md:px-8">
        <div className="py-8 sm:py-12">
          {/* Full width single row layout */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 sm:gap-8 w-full">
            {/* Logo only */}
            <div className="flex-shrink-0 mb-4 md:mb-0">
              <Link to="/" className="inline-block">
                <img 
                  src="/logo-2.png" 
                  alt="LANForge" 
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            
            {/* Navigation columns spanning full width */}
            <div className="flex-1 flex flex-wrap justify-between gap-6 sm:gap-8 md:gap-12 w-full">
              {footerColumns.map((column) => (
                <div key={column.title} className="min-w-[100px] sm:min-w-[120px]">
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                    {column.title}
                  </h3>
                  <ul className="space-y-2">
                    {column.links.map((link) => (
                      <li key={link.name}>
                        <Link 
                          to={link.path}
                          className="text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-300"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {/* Connect / Contact */}
              <div className="min-w-[100px] sm:min-w-[120px]">
                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                  Connect
                </h3>
                {businessInfo?.phone && (
                  <p className="text-xs sm:text-sm text-gray-400 mb-2 break-words">{businessInfo.phone}</p>
                )}
                {businessInfo?.email && (
                  <p className="text-xs sm:text-sm text-gray-400 mb-4 break-words">{businessInfo.email}</p>
                )}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 text-lg"
                    >
                      <FontAwesomeIcon icon={social.icon} />
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Newsletter */}
              <div className="min-w-full sm:min-w-[200px] w-full sm:w-auto">
                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                  Newsletter
                </h3>
                <form onSubmit={handleSubscribe} className="space-y-3 max-w-sm">
                  <input 
                    type="email" 
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm rounded bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400/50"
                  />
                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="btn btn-primary text-sm py-2 w-full disabled:opacity-50"
                  >
                    {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                  </button>
                  {message && (
                    <div className={`text-xs mt-2 ${status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {message}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom bar - full width */}
        <div className="py-4 sm:py-6 border-t border-gray-800/50 w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm w-full">
            <div className="text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} {businessInfo?.storeName || 'LANForge'}. All rights reserved.
            </div>
            
            <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
              {isEnabled('/privacy') && (
              <Link 
                to="/privacy" 
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              )}
              {isEnabled('/terms') && (
              <Link 
                to="/terms" 
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 whitespace-nowrap"
              >
                Terms of Service
              </Link>
              )}
              {isEnabled('/cookies') && (
              <Link 
                to="/cookies" 
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 whitespace-nowrap"
              >
                Cookie Policy
              </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
