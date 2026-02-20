import React from 'react';

const SocialProof = () => {
  const logos = [
    { name: 'FBI', width: 'w-16' },
    { name: 'Interpol', width: 'w-20' },
    { name: 'FinCEN', width: 'w-24' },
    { name: 'SEC', width: 'w-16' },
    { name: 'HSBC', width: 'w-20' },
    { name: 'JPMorgan', width: 'w-24' }
  ];

  return (
    <section className="py-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-y border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-8 uppercase tracking-wider">
          Trusted by Leading Organizations Worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 hover:opacity-100 transition-opacity">
          {logos.map((logo, index) => (
            <div key={index} className={`${logo.width} h-12 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center font-bold text-gray-600 dark:text-gray-400 text-xs`}>
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
