import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faComputerMouse, faDesktop, faHeadphones, faKeyboard } from '@fortawesome/free-solid-svg-icons';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';

interface Accessory {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  features: string[];
  imageColor: string;
  brand: string;
  rating: number;
  inStock: boolean;
}

const AccessoriesPage: React.FC = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/accessories?limit=100`)
      .then(res => res.json())
      .then(data => {
        if (data.accessories) {
          const mapped = data.accessories.map((a: any) => ({
            id: a._id,
            name: a.name,
            category: a.type || 'Other',
            description: a.description,
            price: `$${a.price.toFixed(2)}`,
            compareAtPrice: a.compareAtPrice ? `$${a.compareAtPrice.toFixed(2)}` : undefined,
            features: a.features || [],
            imageColor: '#3a86ff',
            brand: a.brand || 'Unknown',
            rating: a.ratings?.average || 0,
            inStock: a.stock > (a.reserved || 0)
          }));
          setAccessories(mapped);
          
          const uniqueCats = ['All', ...Array.from(new Set(mapped.map((a: any) => a.category)))];
          setCategories(uniqueCats as string[]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const filteredAccessories = selectedCategory === 'All' 
    ? accessories 
    : accessories.filter(accessory => accessory.category === selectedCategory);

  const sortedAccessories = [...filteredAccessories].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''));
      case 'price-high':
        return parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', ''));
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleViewDetails = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
  };

  const handleCloseDetails = () => {
    setSelectedAccessory(null);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400"><FontAwesomeIcon icon={faStar} /></span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400"><FontAwesomeIcon icon={faStar} /></span>);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-600"><FontAwesomeIcon icon={faStar} /></span>);
    }
    
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-emerald-500/30">
      <SEO 
        title="Gaming Accessories & Peripherals | LANForge"
        description="Upgrade your setup with premium gaming keyboards, mice, headsets, and monitors. High-performance gear for competitive gamers."
        url="https://lanforge.co/accessories"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent" />
        <div className="container-narrow relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="heading-1 mb-6">
              Premium Gaming Accessories
            </h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              Enhance your gaming setup with our curated selection of high-performance accessories. 
              From precision mice to immersive audio, find everything you need to level up your gaming experience.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">12+</div>
                <div className="text-gray-400">Categories</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">50+</div>
                <div className="text-gray-400">Products</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">4.7<FontAwesomeIcon icon={faStar} className="text-xl ml-1" /></div>
                <div className="text-gray-400">Avg Rating</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">Free</div>
                <div className="text-gray-400">Shipping</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="py-8 bg-gray-900/50 border-y border-gray-800/50">
        <div className="container-narrow">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-400">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select bg-gray-800/50 border-gray-700/50 text-gray-300 rounded-lg px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Accessories Grid */}
      <section className="section">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedAccessories.map((accessory, index) => (
              <motion.div
                key={accessory.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="card-glow group"
              >
                <div className="p-6">
                  {/* Accessory Image */}
                  <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                    <div 
                      className="absolute inset-0"
                      style={{ backgroundColor: accessory.imageColor }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="badge-accent">
                        {accessory.category}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex justify-between items-center">
                        <div className="badge-secondary">
                          {accessory.brand}
                        </div>
                        {!accessory.inStock && (
                          <div className="badge-warning">
                            Backordered
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accessory Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{accessory.name}</h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {renderStars(accessory.rating)}
                      </div>
                      <span className="text-sm text-gray-400">{accessory.rating.toFixed(1)}</span>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{accessory.description}</p>

                    {/* Features Preview */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Features:</h4>
                      <ul className="space-y-1">
                        {accessory.features.slice(0, 2).map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <svg className="w-4 h-4 text-emerald-400 mt-1 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between border-t border-gray-800/50 pt-4">
                      <div className="flex flex-col">
                        <div className="flex items-end gap-2 mb-0.5">
                          <div className="text-2xl font-bold text-emerald-400">
                            {accessory.price}
                          </div>
                          {accessory.compareAtPrice && (
                            <div className="text-sm text-gray-500 line-through mb-1">
                              {accessory.compareAtPrice}
                            </div>
                          )}
                        </div>
                            {parseFloat(accessory.price.replace('$', '')) > 0 && (
                              <div className="text-[11px] sm:text-xs text-gray-400 flex items-center flex-wrap gap-1 mt-0.5">
                                <span>Starting at</span> <span className="text-blue-400 font-medium">${Math.ceil((parseFloat(accessory.price.replace('$', '')) * 1.0999) / 24)}/mo</span> <span>with</span> <img src="https://cdn-assets.affirm.com/images/white_logo-transparent_bg.png" alt="Affirm" className="h-[14px] inline-block -mt-0.5 translate-y-[1px]" />
                              </div>
                            )}
                          </div>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline"
                          onClick={() => handleViewDetails(accessory)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            let sessionId = localStorage.getItem('cartSessionId');
                            if (!sessionId) {
                              sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
                              localStorage.setItem('cartSessionId', sessionId);
                            }
                            fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`)
                              .then(res => res.json())
                              .then(data => {
                                const existingItems = data.cart?.items || [];
                                const mappedItems = existingItems.map((i: any) => ({
                                  product: i.product?._id || i.product,
                                  pcPart: i.pcPart?._id || i.pcPart,
                                  accessory: i.accessory?._id || i.accessory,
                                  customBuild: i.customBuild?._id || i.customBuild,
                                  quantity: i.quantity
                                }));
                                mappedItems.push({
                                  accessory: accessory.id,
                                  quantity: 1
                                });
                                trackEvent('add_to_cart', window.location.pathname + window.location.search, accessory.id.toString());
                                return fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ items: mappedItems })
                                });
                              })
                              .then(() => {
                                const btn = document.getElementById(`add-icon-btn-${accessory.id}`);
                                if (btn) {
                                  // const originalHtml = btn.innerHTML;
                                  btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                                  btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
                                  setTimeout(() => {
                                    window.location.href = '/cart';
                                  }, 500);
                                } else {
                                  window.location.href = '/cart';
                                }
                              })
                              .catch(err => console.error(err));
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Highlights */}
      <section className="py-10 bg-gray-900/30">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Popular Categories</h2>
            <p className="body-large max-w-3xl mx-auto">
              Explore our most popular accessory categories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
              className="card cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
              onClick={() => setSelectedCategory('Keyboard')}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-3xl mx-auto mb-4 text-emerald-400">
                  <FontAwesomeIcon icon={faKeyboard} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Keyboards</h3>
                <p className="text-gray-400 text-sm">Mechanical, wireless, and RGB keyboards</p>
              </div>
            </div>

            <div 
              className="card cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
              onClick={() => setSelectedCategory('Mouse')}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-3xl mx-auto mb-4 text-emerald-400">
                  <FontAwesomeIcon icon={faComputerMouse} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Mice</h3>
                <p className="text-gray-400 text-sm">Precision gaming mice and accessories</p>
              </div>
            </div>

            <div 
              className="card cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
              onClick={() => setSelectedCategory('Monitor')}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-3xl mx-auto mb-4 text-emerald-400">
                  <FontAwesomeIcon icon={faDesktop} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Monitors</h3>
                <p className="text-gray-400 text-sm">High refresh rate gaming displays</p>
              </div>
            </div>

            <div 
              className="card cursor-pointer group hover:scale-[1.02] transition-transform duration-300"
              onClick={() => setSelectedCategory('Audio')}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-3xl mx-auto mb-4 text-emerald-400">
                  <FontAwesomeIcon icon={faHeadphones} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Audio</h3>
                <p className="text-gray-400 text-sm">Headsets, speakers, and microphones</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accessory Details Modal */}
      {selectedAccessory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-gray-800/50"
          >
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedAccessory.name}</h2>
                  <div className="flex items-center gap-4">
                    <div className="badge-accent">{selectedAccessory.category}</div>
                    <div className="badge-secondary">{selectedAccessory.brand}</div>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedAccessory.rating)}
                      <span className="text-gray-400">{selectedAccessory.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Section */}
                <div>
                  <div 
                    className="h-64 rounded-xl mb-4"
                    style={{ backgroundColor: selectedAccessory.imageColor }}
                  />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="text-4xl font-bold text-gradient-neon">
                        {selectedAccessory.price}
                      </div>
                      {selectedAccessory.compareAtPrice && (
                        <div className="text-xl text-gray-500 line-through">
                          {selectedAccessory.compareAtPrice}
                        </div>
                      )}
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-lg font-medium ${
                      selectedAccessory.inStock 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {selectedAccessory.inStock ? 'In Stock' : 'Backordered - Ships Later'}
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-gray-300">{selectedAccessory.description}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
                    <ul className="space-y-2">
                      {selectedAccessory.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg className="w-5 h-5 text-emerald-400 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button 
                      id="modal-add-btn"
                      className="btn btn-primary flex-1 transition-all duration-300"
                      onClick={() => {
                        let sessionId = localStorage.getItem('cartSessionId');
                        if (!sessionId) {
                          sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
                          localStorage.setItem('cartSessionId', sessionId);
                        }
                        fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`)
                          .then(res => res.json())
                          .then(data => {
                            const existingItems = data.cart?.items || [];
                            const mappedItems = existingItems.map((i: any) => ({
                              product: i.product?._id || i.product,
                              pcPart: i.pcPart?._id || i.pcPart,
                              accessory: i.accessory?._id || i.accessory,
                              customBuild: i.customBuild?._id || i.customBuild,
                              quantity: i.quantity
                            }));
                            mappedItems.push({
                              accessory: selectedAccessory.id,
                              quantity: 1
                            });
                            trackEvent('add_to_cart', window.location.pathname + window.location.search, selectedAccessory.id.toString());
                            return fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ items: mappedItems })
                            });
                          })
                          .then(() => {
                            const btn = document.getElementById('modal-add-btn');
                            if (btn) {
                              btn.innerHTML = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Added!';
                              btn.classList.add('bg-emerald-600', 'text-white');
                              setTimeout(() => {
                                window.location.href = '/cart';
                              }, 500);
                            } else {
                              window.location.href = '/cart';
                            }
                          })
                          .catch(err => console.error(err));
                      }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Add to Cart
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={handleCloseDetails}
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-10">
        <div className="container-narrow">
          <div className="card-glow p-8 md:p-12 text-center">
            <h2 className="heading-2 mb-4">Complete Your Gaming Setup</h2>
            <p className="body-large max-w-2xl mx-auto mb-8">
              All accessories include free shipping and our 30-day satisfaction guarantee. 
              Mix and match to create the perfect gaming environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Shop All Accessories
              </button>
              <button className="btn btn-outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Setup Guide
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccessoriesPage;
