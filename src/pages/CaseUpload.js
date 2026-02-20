import React, { useState } from 'react';

const CaseUpload = ({ darkMode, toggleTheme, onNavigateHome, onNavigateToProcessing }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null); // null, 'valid', 'invalid'
  const [validationMessage, setValidationMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const requiredColumns = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'];

  // Validate CSV structure
  const validateCSV = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        setValidationStatus('invalid');
        setValidationMessage('CSV file is empty or has no data rows');
        return;
      }

      // Check headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        setValidationStatus('invalid');
        setValidationMessage(`Missing required column(s): ${missingColumns.join(', ')}`);
        return;
      }

      // Validate first data row
      const firstDataRow = lines[1].split(',');
      const amountIndex = headers.indexOf('amount');
      const timestampIndex = headers.indexOf('timestamp');

      // Check amount is numeric
      if (amountIndex !== -1 && isNaN(parseFloat(firstDataRow[amountIndex]))) {
        setValidationStatus('invalid');
        setValidationMessage('Invalid amount format: must be numeric');
        return;
      }

      // Check timestamp format (basic validation)
      if (timestampIndex !== -1) {
        const timestamp = firstDataRow[timestampIndex].trim();
        // Accept formats: 
        // YYYY-MM-DD HH:MM:SS (with optional single-digit hour)
        // DD-MM-YYYY HH:mm:ss
        // DD-MM-YYYY HH:mm
        const timestampRegex1 = /^\d{4}-\d{2}-\d{2}\s\d{1,2}:\d{2}:\d{2}$/; // YYYY-MM-DD H:mm:ss or HH:mm:ss
        const timestampRegex2 = /^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2}$/;   // DD-MM-YYYY HH:mm:ss
        const timestampRegex3 = /^\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}$/;         // DD-MM-YYYY HH:mm
        if (!timestampRegex1.test(timestamp) && !timestampRegex2.test(timestamp) && !timestampRegex3.test(timestamp)) {
          setValidationStatus('invalid');
          setValidationMessage('Invalid timestamp format: expected YYYY-MM-DD H:mm:ss or DD-MM-YYYY HH:mm:ss or DD-MM-YYYY HH:mm');
          return;
        }
      }

      // All validations passed
      setValidationStatus('valid');
      setValidationMessage('CSV structure validated successfully');
    };

    reader.readAsText(file);
  };

  const handleFileSelect = (file) => {
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      validateCSV(file);
    } else {
      setValidationStatus('invalid');
      setValidationMessage('Please select a valid CSV file');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAnalyze = () => {
    if (validationStatus === 'valid') {
      onNavigateToProcessing(selectedFile);
    }
  };

  return (
    <div className="min-h-screen dotted-background transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  FINTRACE AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Financial Forensics Engine
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              <button 
                onClick={onNavigateHome}
                className="px-5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-full transition-all duration-200 text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-3">
              Upload Investigation Case
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Upload a transaction CSV file to begin fraud detection analysis
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 shadow-xl">
            
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Drag and drop your CSV file here
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  or
                </p>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <span className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-200 inline-block">
                    Browse Files
                  </span>
                </label>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Accepts: .csv files only
                </p>
              </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedFile.demo ? 'Demo Dataset' : `${(selectedFile.size / 1024).toFixed(2)} KB`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Status */}
            {validationStatus && (
              <div className={`mt-6 p-4 rounded-xl border-2 ${
                validationStatus === 'valid'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700'
              }`}>
                <div className="flex items-start gap-3">
                  {validationStatus === 'valid' ? (
                    <svg className="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div>
                    <p className={`font-semibold ${
                      validationStatus === 'valid'
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {validationStatus === 'valid' ? 'Validation Successful' : 'Validation Failed'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      validationStatus === 'valid'
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {validationMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expected Format */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expected CSV Format
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-blue-600 dark:text-blue-400">
                    transaction_id
                  </code>
                  <span className="text-gray-600 dark:text-gray-400">(String)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-blue-600 dark:text-blue-400">
                    sender_id
                  </code>
                  <span className="text-gray-600 dark:text-gray-400">(String)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-blue-600 dark:text-blue-400">
                    receiver_id
                  </code>
                  <span className="text-gray-600 dark:text-gray-400">(String)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-blue-600 dark:text-blue-400">
                    amount
                  </code>
                  <span className="text-gray-600 dark:text-gray-400">(Float)</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono text-blue-600 dark:text-blue-400">
                    timestamp
                  </code>
                  <span className="text-gray-600 dark:text-gray-400">(DateTime: YYYY-MM-DD H:mm:ss)</span>
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="mt-8">
              <button
                onClick={handleAnalyze}
                disabled={validationStatus !== 'valid'}
                className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-200 ${
                  validationStatus === 'valid'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {validationStatus === 'valid' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Analyze Case
                  </span>
                ) : (
                  'Upload Valid CSV to Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseUpload;
