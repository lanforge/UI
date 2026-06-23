import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faTshirt, faMugHot, faTags, faShippingFast } from '@fortawesome/free-solid-svg-icons';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';

interface MerchItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  brand: string;
  rating: number;
  image: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
}

const MerchPage: React.FC = () => {
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedItem, setSelectedItem] = useState<MerchItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/merch?limit=100`)
      .then(res => res.json())
      .then(data => {
        if (data.merch) {
          const mapped: MerchItem[] = data.merch.map((m: any) => ({
            id: m._id,
            name: m.name,
            category: m.type || 'Other',
            description: m.description,
            price: m.price,
            compareAtPrice: m.compareAtPrice,
            brand: m.brand || 'LANForge',
            rating: m.ratings?.average || 0,
            image: m.images?.[0] || '',
            sizes: m.sizes || [],
            colors: m.colors || [],
            inStock: (m.stock ?? 0) > 0,
          }));
          setMerch(mapped);
          const uniqueCats = ['All', ...Array.from(new Set(mapped.map(m => m.category)))];
          setCategories(uniqueCats);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const filtered = selectedCategory === 'All'
    ? merch
    : merch.filter(m => m.category === selectedCategory);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

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

  const handleViewDetails = (item: MerchItem) => {
    setSelectedItem(item);
    setSelectedSize(item.sizes[0] || '');
    setSelectedColor(item.colors[0] || '');
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setSelectedSize('');
    setSelectedColor('');
  };

  const addToCart = (item: MerchItem, size?: string, color?: string) => {
    if (item.sizes.length > 0 && !size) {
      handleViewDetails(item);
      return;
    }
    if (item.colors.length > 0 && !color) {
      handleViewDetails(item);
      return;
    }

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
          merch: i.merch?._id || i.merch,
          customBuild: i.customBuild?._id || i.customBuild,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        }));
        mappedItems.push({
          merch: item.id,
          size: size || undefined,
          color: color || undefined,
          quantity: 1,
        });
        trackEvent('add_to_cart', window.location.pathname + window.location.search, item.id);
        return fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: mappedItems }),
        });
      })
      .then(() => {
        window.location.href = '/cart';
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-emerald-500/30">
      <SEO
        title="LANForge Merch | Apparel & Swag"
        description="Rep the brand with official LANForge merch — tees, hoodies, mugs, stickers and more."
        url="https://lanforge.co/merch"
      />

      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent" />
        <div className="container-narrow relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="heading-1 mb-6">Official LANForge Merch</h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              Tees, hoodies, mugs, stickers and more. Rep the brand on stream, at the LAN, or
              anywhere you want to look fast even when your PC isn&apos;t plugged in.
            </p>
          </motion.div>
        </div>
      </section>

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
                  {category.charAt(0).toUpperCase() + category.slice(1)}
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

      <section className="section">
        <div className="container-narrow">
          {sorted.length === 0 ? (
            <div className="text-center py-20">
              <FontAwesomeIcon icon={faTshirt} className="text-5xl text-gray-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No merch available yet</h3>
              <p className="text-gray-500">Check back soon — new drops on the way.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sorted.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="card-glow group"
                >
                  <div className="p-6">
                    <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-gray-800">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl text-gray-700">
                          <FontAwesomeIcon icon={faTshirt} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <div className="badge-accent capitalize">{item.category}</div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex justify-between items-center">
                          <div className="badge-secondary">{item.brand}</div>
                          {!item.inStock && <div className="badge-warning">Sold Out</div>}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.name}</h3>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">{renderStars(item.rating)}</div>
                      <span className="text-sm text-gray-400">{item.rating.toFixed(1)}</span>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.description}</p>

                    {(item.sizes.length > 0 || item.colors.length > 0) && (
                      <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-3">
                        {item.sizes.length > 0 && <span>Sizes: {item.sizes.join(', ')}</span>}
                        {item.colors.length > 0 && <span>Colors: {item.colors.join(', ')}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-800/50 pt-4">
                      <div className="flex items-end gap-2">
                        <div className="text-2xl font-bold text-emerald-400">${item.price.toFixed(2)}</div>
                        {item.compareAtPrice && (
                          <div className="text-sm text-gray-500 line-through mb-1">
                            ${item.compareAtPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-outline" onClick={() => handleViewDetails(item)}>
                          View
                        </button>
                        <button
                          className="btn btn-primary"
                          disabled={!item.inStock}
                          onClick={() => addToCart(item, item.sizes[0], item.colors[0])}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10 bg-gray-900/30">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <FontAwesomeIcon icon={faShippingFast} className="text-3xl text-emerald-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Fast Shipping</h3>
              <p className="text-gray-400 text-sm">Orders ship within 2 business days.</p>
            </div>
            <div className="card p-6 text-center">
              <FontAwesomeIcon icon={faTags} className="text-3xl text-emerald-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Limited Drops</h3>
              <p className="text-gray-400 text-sm">When it&apos;s gone, it&apos;s gone — print runs are small.</p>
            </div>
            <div className="card p-6 text-center">
              <FontAwesomeIcon icon={faMugHot} className="text-3xl text-emerald-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Premium Quality</h3>
              <p className="text-gray-400 text-sm">Heavyweight fabrics, durable prints, built to last.</p>
            </div>
          </div>
        </div>
      </section>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-gray-800/50"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.name}</h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="badge-accent capitalize">{selectedItem.category}</div>
                    <div className="badge-secondary">{selectedItem.brand}</div>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedItem.rating)}
                      <span className="text-gray-400">{selectedItem.rating.toFixed(1)}</span>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="h-64 rounded-xl mb-4 bg-gray-800 overflow-hidden">
                    {selectedItem.image ? (
                      <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl text-gray-700">
                        <FontAwesomeIcon icon={faTshirt} />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="text-4xl font-bold text-gradient-neon">
                        ${selectedItem.price.toFixed(2)}
                      </div>
                      {selectedItem.compareAtPrice && (
                        <div className="text-xl text-gray-500 line-through">
                          ${selectedItem.compareAtPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-lg font-medium ${
                      selectedItem.inStock
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {selectedItem.inStock ? 'In Stock' : 'Sold Out'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-gray-300">{selectedItem.description}</p>
                  </div>

                  {selectedItem.sizes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Size</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.sizes.map(s => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`px-4 py-2 rounded-lg font-medium border transition-all ${
                              selectedSize === s
                                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.colors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Color</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.colors.map(c => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`px-4 py-2 rounded-lg font-medium border transition-all ${
                              selectedColor === c
                                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      className="btn btn-primary flex-1"
                      disabled={!selectedItem.inStock || (selectedItem.sizes.length > 0 && !selectedSize) || (selectedItem.colors.length > 0 && !selectedColor)}
                      onClick={() => addToCart(selectedItem, selectedSize, selectedColor)}
                    >
                      Add to Cart
                    </button>
                    <button className="btn btn-outline" onClick={handleCloseDetails}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MerchPage;
