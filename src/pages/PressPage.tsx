import React from 'react';
import { motion } from 'framer-motion';

const PressPage: React.FC = () => {
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
              Press & Media
            </h1>
            <p className="body-large max-w-3xl mx-auto">
              Media resources, press releases, and brand assets for journalists and content creators
            </p>
          </motion.div>
        </div>
      </section>

      {/* Press Content */}
      <section className="section">
        <div className="container-narrow">
          <div className="space-y-8">

            {/* Section 1: Featured Press Release */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card-glow p-8"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium mb-3">Featured Release</span>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Dignitas Announces Strategic Partnership with LANForge to Power Next-Generation Competitive and IRL Experiences</h2>
                      <p className="text-gray-400 font-medium">December 19, 2025 • Los Angeles</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 text-gray-300 leading-relaxed">
                    <p>
                      <strong>LOS ANGELES, Dec. 19, 2025</strong> /PRNewswire/ -- Dignitas, one of the world's most recognized esports organizations, has announced a new partnership with <strong>LANForge</strong>, a gaming PC provider creating PCs for performance and reliability.
                    </p>
                    <p>
                      Through this collaboration, LANForge will supply top of the line gaming PCs for Dignitas players designed to meet the demands of elite competition. These upgrades also extend to Dignitas' live, in-person activations, where enhanced 1v1 stations will provide fans with smooth, uninterrupted gameplay at LAN events, watch parties, and conventions.
                    </p>
                    <p>
                      In addition to player and event upgrades, LANForge will fully outfit Dignitas' broadcast and content teams with modern, mobile IRL streaming technology. This new travel-ready setup will allow Dignitas to produce higher-quality live content on the road, helping to bring fans closer to the action at events, behind the scenes, and in real-world esports moments.
                    </p>
                    <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 my-6 bg-gray-800/30 rounded-r-lg italic">
                      "Partnering with LANForge is an awesome opportunity for our players to be outfitted in elite equipment made by a community-led brand who cares about delivering a true competitive edge. Dignitas is proud to welcome LANForge as a partner; their commitment to engineering top-of-the-line gear matches our own dedication to winning, and we can't wait to see our players thrive with their support," said <strong>Jake Clements, VP of Partnerships at Dignitas</strong>.
                    </blockquote>
                    <p>
                      LANForge shares the vision of pushing esports infrastructure forward through innovation and reliability.
                    </p>
                    <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 my-6 bg-gray-800/30 rounded-r-lg italic">
                      "We build our systems for moments where performance matters most. Partnering with Dignitas lets us support high levels of competition and live production without performance compromise." said <strong>Damian Penzone, Founder and CEO at LANForge</strong>.
                    </blockquote>
                    <p>
                      The partnership will debut across upcoming Dignitas events and activations, with LANForge branding integrated into player environments, 1v1 setups, and IRL broadcast content.
                    </p>
                    <div className="pt-6 mt-6 border-t border-gray-800">
                      <p className="text-sm">For more information about Dignitas, visit <a href="https://dignitas.gg/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-medium">dignitas.gg</a>.</p>
                      <p className="text-sm mt-2">For more information about LANForge, visit <a href="https://lanforge.co/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-medium">lanforge.co</a>.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 2: About LANForge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card-glow p-8"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-4">About LANForge</h2>
                  <div className="space-y-4">
                    <p className="text-gray-300">
                      LANForge is a premium custom PC builder specializing in high-performance gaming and workstation systems. 
                      Founded in 2025 by a team of passionate gamers and hardware enthusiasts, we've quickly become a trusted 
                      name in the custom PC industry.
                    </p>
                    <p className="text-gray-300">
                      Our mission is to deliver exceptional performance, quality, and customer service. Each LANForge system 
                      is hand-built by our expert technicians, tested rigorously, and backed by our comprehensive warranty.
                    </p>
                    <p className="text-gray-300">
                      As an official partner of Dignitas, one of the world's leading esports organizations, we bring professional-grade 
                      performance and reliability to gamers at all levels. Our partnership ensures that LANForge systems meet the 
                      demanding standards of professional esports athletes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 3: Media Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card-glow p-8"
            >
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl font-bold text-emerald-400 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-4">Media Contact</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">LANForge Press Office</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Press Inquiries</div>
                            <a href="mailto:press@lanforge.co" className="text-gradient-neon font-medium hover:underline">
                              press@lanforge.co
                            </a>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400">Address</div>
                            <div className="text-white">
                              LANForge Headquarters<br />
                              United States
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-gray-300">General Media: <a href="mailto:media@lanforge.co" className="text-gradient-neon hover:underline">media@lanforge.co</a></span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-gray-300">For fastest service, include "PRESS" in your email subject line</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-gray-300">Our press team is available Monday-Friday, 9 AM - 6 PM EST</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default PressPage;
