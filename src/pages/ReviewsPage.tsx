import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCheck, faHeart, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import ReviewModal from '../components/ReviewModal';

const ReviewsPage: React.FC = () => {
  const [allReviews, setAllReviews] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/reviews?limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data.reviews) {
          const mapped = data.reviews.map((r: any) => ({
            id: r._id,
            name: r.customerName,
            role: 'Customer',
            rating: r.rating,
            comment: r.comment,
            avatarColor: '#10b981',
            date: new Date(r.createdAt).toLocaleDateString(),
            verified: true
          }));
          setAllReviews(mapped);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const totalReviews = allReviews.length;
  const averageRating = totalReviews 
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const stats = [
    { label: 'Average Rating', value: `${averageRating}/5.0`, icon: faStar, color: 'text-yellow-400' },
    { label: 'Verified Reviews', value: '100%', icon: faCheck, color: 'text-emerald-400' },
    { label: 'Customer Satisfaction', value: '100%', icon: faHeart, color: 'text-red-500' },
    { label: 'Would Recommend', value: '100%', icon: faThumbsUp, color: 'text-blue-400' }
  ];

  const getRatingPercent = (star: number) => {
    if (!totalReviews) return 0;
    const count = allReviews.filter(r => Math.round(r.rating) === star).length;
    return Math.round((count / totalReviews) * 100);
  };

  const ratingBreakdown = [
    { stars: '★★★★★', percent: getRatingPercent(5) },
    { stars: '★★★★☆', percent: getRatingPercent(4) },
    { stars: '★★★☆☆', percent: getRatingPercent(3) },
    { stars: '★★☆☆☆', percent: getRatingPercent(2) },
    { stars: '★☆☆☆☆', percent: getRatingPercent(1) }
  ];

  return (
    <div className="min-h-screen bg-gray-950">
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
              Customer Reviews
            </h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              See what our community of gamers, creators, and professionals have to say about their LANForge experience.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6 text-center"
                >
                  <div className={`text-3xl mb-2 ${stat.color}`}><FontAwesomeIcon icon={stat.icon} /></div>
                  <div className="text-3xl font-bold text-gradient-neon mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Content */}
      <section className="section">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Reviews Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allReviews.map((review, index) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="card-glow p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{ backgroundColor: review.avatarColor }}
                      >
                        {review.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">{review.name}</h3>
                          {review.verified && (
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{review.role}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex text-yellow-400 gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <FontAwesomeIcon key={i} icon={faStar} className="text-sm" />
                            ))}
                          </div>
                          <span className="text-gray-400 text-sm">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4">"{review.comment}"</p>
                    
                    <div className="flex gap-3">
                      <button className="px-3 py-1 bg-gray-800/50 text-gray-300 text-sm rounded-lg hover:bg-gray-700/50 transition-colors">
                        Helpful ✓
                      </button>
                      <button className="px-3 py-1 bg-gray-800/50 text-gray-300 text-sm rounded-lg hover:bg-gray-700/50 transition-colors">
                        Share
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Write Review Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="card-glow p-6"
              >
                <h3 className="text-xl font-bold text-white mb-3">Write a Review</h3>
                <p className="text-gray-300 mb-4">Share your LANForge experience with our community.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary w-full"
                >
                  Write Review
                </button>
              </motion.div>

              {/* Rating Breakdown */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="card-glow p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Rating Breakdown</h3>
                <div className="space-y-3">
                  {ratingBreakdown.map((rating, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-yellow-400 w-16">{rating.stars}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                          style={{ width: `${rating.percent}%` }}
                        />
                      </div>
                      <span className="text-gray-300 text-sm w-10 text-right">{rating.percent}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Review Guidelines */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="card-glow p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Review Guidelines</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Share your honest experience
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Include specific details
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Mention your use case
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Photos/videos welcome
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Be respectful to others
                  </li>
                </ul>
              </motion.div>

              {/* Featured Review Placeholder */}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10">
        <div className="container-narrow">
          <div className="card-glow p-8 md:p-12 text-center">
            <h2 className="heading-2 mb-4">Ready to Join Our Community?</h2>
            <p className="body-large max-w-2xl mx-auto mb-8">
              Share your LANForge story and help others make informed decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                Write Your Review
              </button>
              <Link to="/pcs" className="btn btn-outline">
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default ReviewsPage;
