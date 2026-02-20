import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            FINTRACE AI
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Built for financial crime investigation
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
