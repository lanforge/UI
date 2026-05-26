import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faHeart, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import ReviewModal from './ReviewModal';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/reviews?limit=3`)
      .then(res => res.json())
      .then(data => {
        if (data.reviews) {
          const mapped = data.reviews.map((r: any) => ({
            id: r._id,
            name: r.customerName,
            role: 'Customer',
            rating: r.rating,
            comment: r.comment,
            avatarColor: '#10b981'
          }));
          setReviews(mapped);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="section py-32 relative overflow-hidden bg-gray-950">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>
      
      <div className="container-narrow relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-cyan-500/50 mb-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Customer Reviews</span>
          </div>
          
          <h2 className="heading-2 mb-6">
            What Our <span className="text-gradient-cyber">Customers Say</span>
          </h2>
          
          <p className="body-large max-w-3xl mx-auto">
            Join thousands of satisfied gamers, creators, and professionals who trust LANForge for their PC needs.
          </p>
        </motion.div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50 group"
            >
              <div className="p-6">
                {/* Review header */}
                <div className="flex items-start gap-4 mb-6">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: review.avatarColor }}
                  >
                    {review.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">{review.name}</h4>
                        <p className="text-sm text-gray-400">{review.role}</p>
                      </div>
                      <div className="flex text-yellow-400 gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <FontAwesomeIcon key={i} icon={faStar} className="text-sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Review comment */}
                <p className="text-gray-300 italic mb-6">"{review.comment}"</p>
                
                {/* Verified badge */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Verified Purchase</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <div className="grid grid-cols-3 gap-6">
            {[
              { number: '5/5', label: 'Average Rating', icon: faStar, color: 'text-yellow-400' },
              { number: '100%', label: 'Satisfaction Rate', icon: faHeart, color: 'text-red-500' },
              { number: '24/7', label: 'Support Available', icon: faShieldHalved, color: 'text-blue-400' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl text-center p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                <div className={`text-2xl mb-3 ${stat.color}`}><FontAwesomeIcon icon={stat.icon} /></div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-2">{stat.number}</div>
                <div className="text-sm text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4">
            <Link to="/reviews">
              <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50 inline-block">
                <button className="skew-x-[10deg] px-6 py-3 font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300">
                  Read More Reviews
                </button>
              </div>
            </Link>
            <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="skew-x-[10deg] px-6 py-3 font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300"
              >
                Write a Review
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <ReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
};

export default Reviews;
