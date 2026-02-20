import React from 'react';

const TestimonialCard = ({ quote, author, role, rating, savings }) => {
  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4 italic">"{quote}"</p>
      {savings && (
        <div className="mb-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-bold text-green-700 dark:text-green-400">💰 Saved: {savings}</p>
        </div>
      )}
      <div>
        <p className="font-bold text-gray-900 dark:text-white">{author}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      quote: "We caught a $12M fraud ring in under 2 hours. This tool paid for itself 100x over in the first week.",
      author: "Sarah Chen",
      role: "Chief Fraud Officer, Global Bank",
      rating: 5,
      savings: "$12.3M recovered"
    },
    {
      quote: "Finally, a tool that actually works. Cut our investigation time from 3 weeks to 45 minutes. Game changer.",
      author: "Michael Rodriguez",
      role: "Special Agent, Financial Crimes Unit",
      rating: 5,
      savings: "95% time saved"
    },
    {
      quote: "The AI detected patterns our team missed for months. Prevented a massive money laundering operation.",
      author: "Dr. Aisha Patel",
      role: "AML Director, FinTech Corp",
      rating: 5,
      savings: "$8.7M prevented"
    }
  ];

  return (
    <section className="py-20 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Real Results from Real Investigators
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Don't just take our word for it
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
