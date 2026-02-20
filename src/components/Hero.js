import React, { useState, useEffect } from 'react';

const Hero = ({ onNavigateToUpload, onLoadCase, onFileUpload }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [caseHistory, setCaseHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, caseId: null, input: '' });

  // Load case history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('caseHistory') || '[]');
    setCaseHistory(history.slice(0, 5)); // Show last 5 cases
  }, []);

  const handleDeleteCase = (caseId, e) => {
    e.stopPropagation(); // Prevent case click
    setDeleteConfirm({ show: true, caseId: caseId, input: '' });
  };

  const confirmDelete = () => {
    if (deleteConfirm.input.toLowerCase() === 'delete') {
      // Remove from localStorage
      const history = JSON.parse(localStorage.getItem('caseHistory') || '[]');
      const updatedHistory = history.filter(c => c.caseId !== deleteConfirm.caseId);
      localStorage.setItem('caseHistory', JSON.stringify(updatedHistory));
      
      // Update state
      setCaseHistory(updatedHistory.slice(0, 5));
      setDeleteConfirm({ show: false, caseId: null, input: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, caseId: null, input: '' });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Search for case by ID
      const history = JSON.parse(localStorage.getItem('caseHistory') || '[]');
      const foundCase = history.find(c => c.caseId === searchQuery.trim());
      
      if (foundCase && onLoadCase) {
        onLoadCase(foundCase);
      } else {
        alert('Case ID not found. Please check the ID and try again.');
      }
    }
  };

  const handleCaseClick = (caseItem) => {
    if (onLoadCase) {
      onLoadCase(caseItem);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.name.endsWith('.csv')) {
      if (onFileUpload) {
        onFileUpload(file);
      }
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 transition-colors duration-300 overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full mb-6">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">Trusted by 500+ Financial Institutions</span>
          </div>
          
          {/* Handwritten style heading with star */}
          <div className="relative inline-block mb-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-handwriting font-bold text-blue-600 dark:text-blue-500">
              Financial Forensics
            </h2>
            <span className="absolute -top-2 -right-8 text-yellow-400 text-3xl animate-bounce">✨</span>
          </div>
          
          {/* Main bold heading with gradient */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
            Catch Fraudsters
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              95% Faster
            </span>
          </h1>
          
          {/* Handwritten "in seconds" text */}
          <p className="text-4xl sm:text-5xl font-handwriting font-semibold text-gray-800 dark:text-gray-300 mb-6">
            in Seconds, Not Weeks!
          </p>
          
          {/* Compelling value proposition */}
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-2 font-medium">
            Stop losing <span className="text-red-600 dark:text-red-500 font-bold">$2.8M annually</span> to money laundering.
          </p>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
            AI-powered detection uncovers hidden fraud rings, mule accounts & suspicious patterns instantly. 
            <span className="font-handwriting text-blue-600 dark:text-blue-500 text-xl ml-2">Together we find truth!</span>
          </p>
          
          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-500">98.7%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Detection Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-500">&lt;30s</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Avg Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-500">$847M</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Fraud Prevented</div>
            </div>
          </div>
          
          {/* Search/Input Box with urgency */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
              <div 
                className="relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                  placeholder="🔍 Paste Case ID or Drop CSV File Here..."
                  className={`w-full px-6 py-4 pr-44 rounded-full border-2 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  } text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all shadow-lg`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                  <label className="cursor-pointer px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-full transition-all duration-200 shadow-md flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={handleSearch}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-full transition-all duration-200 shadow-md"
                  >
                    Analyze
                  </button>
                </div>
              </div>
              
              {/* Case History Dropdown */}
              {showHistory && caseHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Recent Cases</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {caseHistory.map((caseItem, index) => (
                      <div
                        key={index}
                        className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                      >
                        <button
                          onClick={() => handleCaseClick(caseItem)}
                          className="flex-1 text-left flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{caseItem.caseId}</span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                caseItem.suspiciousAccounts > 0 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {caseItem.suspiciousAccounts} Suspicious
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span>{caseItem.totalAccounts} accounts</span>
                              <span>•</span>
                              <span>{caseItem.timestamp}</span>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteCase(caseItem.caseId, e)}
                          className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete case"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">⚡ Free analysis • No credit card required • Results in 30 seconds</p>
          </div>
          
          {/* CTA Buttons with social proof */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button 
              onClick={onNavigateToUpload}
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Start Free Investigation
              <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-gray-900 text-xs font-black rounded-full">FREE</span>
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full border-2 border-gray-300 dark:border-gray-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch 2-Min Demo
            </button>
          </div>
          
          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-gray-900"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 border-2 border-white dark:border-gray-900"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white dark:border-gray-900"></div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white dark:border-gray-900"></div>
            </div>
            <span className="font-medium">Join <span className="font-bold text-gray-900 dark:text-white">2,847</span> investigators who caught fraudsters this month</span>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Case</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Case ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{deleteConfirm.caseId}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Type <span className="font-bold text-red-600 dark:text-red-500">delete</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirm.input}
                onChange={(e) => setDeleteConfirm(prev => ({ ...prev, input: e.target.value }))}
                placeholder="Type 'delete' here"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirm.input.toLowerCase() !== 'delete'}
                className={`flex-1 px-4 py-2 font-semibold rounded-lg transition-all duration-200 ${
                  deleteConfirm.input.toLowerCase() === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                Delete Case
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Decorative elements */}
      <div className="absolute bottom-20 left-10 text-yellow-400 text-2xl animate-bounce" style={{animationDelay: '0.5s'}}>✨</div>
      <div className="absolute bottom-32 right-16 text-yellow-400 text-xl animate-bounce" style={{animationDelay: '1.5s'}}>✨</div>
      <div className="absolute top-40 right-20 text-blue-400 text-lg animate-bounce" style={{animationDelay: '2s'}}>💎</div>
    </section>
  );
};

export default Hero;
