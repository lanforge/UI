import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptop, faEnvelope, faCartShopping, faGear, faTruckFast } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const ContactPage: React.FC = () => {
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
              Get in Touch
            </h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              Our support team is here to help with any questions about our products, orders, or technical support. 
              We're committed to providing exceptional customer service.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Layout */}
      <section className="section">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="card-glow p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
                
                <div className="space-y-8">
                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-xl">
                      <FontAwesomeIcon icon={faEnvelope} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
                      <p className="text-gradient-neon text-lg font-medium mb-1">support@lanforge.co</p>
                      <p className="text-gray-400 text-sm">Typically respond within 24 hours</p>
                    </div>
                  </div>

                  {/* Live Chat */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-xl">
                      💬
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
                      <p className="text-white mb-1">Available via Live Chat widget</p>
                      <p className="text-gray-400 text-sm">Bottom right corner of every page</p>
                    </div>
                  </div>

                  {/* Support Hours */}
                  <div className="pt-6 border-t border-gray-800/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Support Hours</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Monday - Friday</span>
                        <span className="text-white font-medium">9:00 AM - 6:00 PM EST</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Saturday</span>
                        <span className="text-white font-medium">10:00 AM - 4:00 PM EST</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Sunday</span>
                        <span className="text-red-400 font-medium">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="card p-8">
                <h3 className="text-xl font-bold text-white mb-6">Common Questions</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">How long does shipping take?</h4>
                    <p className="text-gray-400">Standard shipping: 3-5 business days. Express shipping: 1-2 business days.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">What's your return policy?</h4>
                    <p className="text-gray-400">14-day return policy for unopened items. See our full policy <a href="/shipping" className="text-emerald-400 hover:text-emerald-300">here</a>.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Do you offer international shipping?</h4>
                    <p className="text-gray-400">Yes, we ship to most countries. Contact us for specific rates and delivery times.</p>
                  </div>
                </div>
                <a href="/faq" className="btn btn-outline w-full mt-6">
                  View All FAQs
                </a>
              </div>
            </motion.div>

            {/* Support Ticket Instructions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="card-glow p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Get Support</h2>
                
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
                      💬
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Live Chat Support</h3>
                    <p className="text-gray-400">Available 7 days a week</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-gray-300">
                        Click the <strong className="text-white">Live chat widget</strong> in the 
                        <strong className="text-white"> bottom right corner</strong> of your screen
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-gray-300">Start a live chat with our support team</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-gray-300">Create and track support tickets</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-gray-300">Get instant responses to common questions</p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-gray-300">Receive updates on your inquiries</p>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      <strong>Note:</strong> The Live chat widget is available on every page of our website.
                      Just look for the chat bubble in the bottom right corner!
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Categories */}
              <div className="card p-8">
                <h3 className="text-xl font-bold text-white mb-6">Support Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-lg mb-2"><FontAwesomeIcon icon={faCartShopping} /></div>
                    <h4 className="font-semibold text-white mb-1">Order Support</h4>
                    <p className="text-gray-400 text-sm">Tracking, returns, and order questions</p>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-lg mb-2"><FontAwesomeIcon icon={faGear} /></div>
                    <h4 className="font-semibold text-white mb-1">Technical Support</h4>
                    <p className="text-gray-400 text-sm">Setup, troubleshooting, and repairs</p>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-lg mb-2"><FontAwesomeIcon icon={faLaptop} /></div>
                    <h4 className="font-semibold text-white mb-1">Product Questions</h4>
                    <p className="text-gray-400 text-sm">Specifications and compatibility</p>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="text-lg mb-2"><FontAwesomeIcon icon={faTruckFast} /></div>
                    <h4 className="font-semibold text-white mb-1">Shipping & Delivery</h4>
                    <p className="text-gray-400 text-sm">Shipping options and delivery times</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10">
        <div className="container-narrow">
          <div className="card-glow p-8 md:p-12 text-center">
            <h2 className="heading-2 mb-4">Need Immediate Assistance?</h2>
            <p className="body-large max-w-2xl mx-auto mb-8">
              Our live chat support is available during business hours for instant help. 
              For complex inquiries, email us and we'll provide detailed assistance within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start Live Chat
              </button>
              <a href="mailto:support@lanforge.co" className="btn btn-outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
