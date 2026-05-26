import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';

const CookiePolicyPage: React.FC = () => {
  const [content, setContent] = useState({ title: 'Cookie Policy', content: 'Loading...' });

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/pages/cookie-policy`)
      .then(res => res.json())
      .then(data => {
        if (data.page) setContent(data.page);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent" />
        <div className="container-narrow relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="heading-1 mb-6">{content.title}</h1>
            <div className="prose prose-invert max-w-4xl mx-auto text-left text-gray-300 prose-headings:text-white prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-white prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 bg-gray-900/40 p-6 md:p-10 rounded-2xl border border-gray-800/60 shadow-xl backdrop-blur-sm mt-8">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkBreaks]} 
                rehypePlugins={[rehypeRaw]}
              >
                {content.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicyPage;
