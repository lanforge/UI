import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone,
  faWrench,
  faLaptop,
  faTruck,
  faRotate,
  faShieldHalved,
  faCreditCard,
  faGear,
  faCircleQuestion,
  faCommentDots
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
  icon: React.ReactNode;
}

const FAQPage: React.FC = () => {
  const [faqCategories, setFaqCategories] = useState<FAQCategory[]>([]);
  const [openItems, setOpenItems] = useState<{[key: string]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/faqs`)
      .then(res => res.json())
      .then(data => {
        if (data.faqs) {
          // Group by category
          const groups: Record<string, FAQItem[]> = {};
          data.faqs.forEach((faq: any) => {
            const cat = faq.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push({ question: faq.question, answer: faq.answer });
          });
          const getCategoryIcon = (categoryStr: string) => {
            if (categoryStr.includes('General')) return <FontAwesomeIcon icon={faWrench} />;
            if (categoryStr.includes('Orders')) return <FontAwesomeIcon icon={faLaptop} />;
            if (categoryStr.includes('Shipping')) return <FontAwesomeIcon icon={faTruck} />;
            if (categoryStr.includes('Returns')) return <FontAwesomeIcon icon={faRotate} />;
            if (categoryStr.includes('Warranty')) return <FontAwesomeIcon icon={faShieldHalved} />;
            if (categoryStr.includes('Payments')) return <FontAwesomeIcon icon={faCreditCard} />;
            if (categoryStr.includes('Performance')) return <FontAwesomeIcon icon={faGear} />;
            if (categoryStr.includes('Support')) return <FontAwesomeIcon icon={faPhone} />;
            return <FontAwesomeIcon icon={faCircleQuestion} />;
          };

          const formattedCategories: FAQCategory[] = Object.keys(groups).map(cat => ({
            title: cat,
            items: groups[cat],
            icon: getCategoryIcon(cat)
          }));
          setFaqCategories(formattedCategories);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const toggleFAQ = (categoryTitle: string, question: string) => {
    const key = `${categoryTitle}-${question}`;
    console.log('Toggling FAQ:', key, 'Current state:', openItems[key]);
    console.log('Click event fired for:', question);
    setOpenItems(prev => {
      const newState = !(prev[key] || false);
      console.log('Setting new state for', key, 'to:', newState);
      return {
        ...prev,
        [key]: newState
      };
    });
  };

  const toggleCategory = (categoryTitle: string) => {
    setActiveCategory(activeCategory === categoryTitle ? null : categoryTitle);
  };

  // Filter FAQ items based on search query
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  // Generate FAQ schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqCategories.flatMap(category => 
      category.items.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    )
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <SEO 
        title="Frequently Asked Questions | LANForge"
        description="Find answers to common questions about ordering, products, warranty, and more from LANForge."
        url="https://lanforge.co/faq"
        schema={faqSchema}
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
              Frequently Asked Questions
            </h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              Find answers to common questions about ordering, products, warranty, and more
            </p>
            
          </motion.div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="section">
        <div className="container-narrow">
          {/* Category Navigation */}
          <div className="flex flex-wrap gap-3 mb-12">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                activeCategory === null
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              All Categories
            </button>
            {faqCategories.map((category) => (
              <button
                key={category.title}
                onClick={() => toggleCategory(category.title)}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                  activeCategory === category.title
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {category.icon} {category.title}
              </button>
            ))}
          </div>

          {/* FAQ Content */}
          <div className="space-y-8">
            {(activeCategory 
              ? filteredCategories.filter(cat => cat.title === activeCategory)
              : filteredCategories
            ).map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl">
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                    <p className="text-gray-400">{category.items.length} questions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => {
                    const key = `${category.title}-${item.question}`;
                    const isOpen = !!openItems[key]; // Convert undefined to false
                    
                    return (
                      <div
                        key={itemIndex}
                        className="bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-emerald-400/30 transition-colors duration-200"
                      >
                        <div 
                          onClick={() => toggleFAQ(category.title, item.question)}
                          className="w-full p-6 flex items-center justify-between text-left cursor-pointer hover:bg-gray-700/20 transition-colors duration-200"
                        >
                          <h3 className="text-lg font-semibold text-white pr-8">
                            {item.question}
                          </h3>
                          <div
                            className={`w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center text-emerald-400 flex-shrink-0 hover:bg-gray-600/50 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="px-6 pb-6">
                            <div className="pt-4 border-t border-gray-700/50">
                              <p className="text-gray-300 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-10 bg-gray-900/30">
        <div className="container-narrow">
          <div className="card-glow p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="heading-2 mb-6">Still Have Questions?</h2>
                <p className="body-large mb-8">
                  Can't find the answer you're looking for? Our support team is here to help.
                </p>
                
                <div className="space-y-6">


                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-xl">
                      <FontAwesomeIcon icon={faCommentDots} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
                      <p className="text-white">Available via Live Chat widget</p>
                      <p className="text-gray-400 text-sm">Bottom right corner of every page</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-gray-900/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Support Tips</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Include your order number for faster service</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Provide detailed descriptions of your issue</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Attach photos or videos when applicable</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-300">Check our knowledge base for common solutions</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <p className="text-gray-400 text-sm">
                    For fastest response, please include your order number (if applicable) and a detailed description of your question.
                    Our support team typically responds within 24 hours during business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10">
        <div className="container-narrow">
          <div className="card-glow p-8 md:p-12 text-center">
            <h2 className="heading-2 mb-4">Need Immediate Assistance?</h2>
            <p className="body-large max-w-2xl mx-auto mb-8">
              Our live chat support is available 24/7 for urgent issues. 
              For complex inquiries, contact our support team directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="btn btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Live Chat Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;

