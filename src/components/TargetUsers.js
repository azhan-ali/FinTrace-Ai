import React from 'react';

const UserCard = ({ icon, title, description, badge }) => {
  return (
    <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-10 rounded-3xl border-2 border-gray-200 dark:border-gray-700 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 dark:hover:border-blue-500">
      <div className="inline-block mb-3 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{badge}</span>
      </div>
      <div className="flex justify-center mb-6 text-blue-600 dark:text-blue-500 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
};

const TargetUsers = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-blue-900/10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
            Built for the Frontline Heroes
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-handwriting">
            Fighting financial crime, one case at a time
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <UserCard
            icon={
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="Government Investigators"
            description="FBI, Interpol, FinCEN, and law enforcement agencies worldwide"
            badge="🏛️ Public Sector"
          />
          <UserCard
            icon={
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Bank & Fintech Risk Teams"
            description="AML officers, fraud analysts, and compliance teams at financial institutions"
            badge="🏦 Private Sector"
          />
        </div>
      </div>
    </section>
  );
};

export default TargetUsers;
