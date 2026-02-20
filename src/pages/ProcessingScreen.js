import React, { useState, useEffect, useMemo } from 'react';

const ProcessingScreen = ({ darkMode, onNavigateToDashboard }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = useMemo(() => [
    {
      id: 1,
      title: 'Building transaction graph',
      description: 'Mapping relationships between accounts',
      duration: 1000
    },
    {
      id: 2,
      title: 'Detecting fraud patterns',
      description: 'Analyzing suspicious activity clusters',
      duration: 1200
    },
    {
      id: 3,
      title: 'Calculating risk scores',
      description: 'Evaluating threat levels',
      duration: 1000
    },
    {
      id: 4,
      title: 'Generating investigation output',
      description: 'Preparing forensic report',
      duration: 800
    }
  ], []);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Sequential step animation
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, steps[currentStep]?.duration || 1000);

      return () => clearTimeout(timer);
    } else {
      // All steps complete, navigate to dashboard after a brief delay
      const finalTimer = setTimeout(() => {
        onNavigateToDashboard();
      }, 500);

      return () => clearTimeout(finalTimer);
    }
  }, [currentStep, steps, onNavigateToDashboard]);

  return (
    <div className="min-h-screen dotted-background flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 sm:p-12 shadow-2xl">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Animated Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 animate-pulse">
                <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3">
                Analyzing Transaction Network
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Building graph and detecting suspicious activity...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-500">
                  {progress}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Processing Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-500 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-600'
                        : isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600'
                        : 'bg-gray-50 dark:bg-gray-900/30 border-2 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Step Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {isCompleted ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : isActive ? (
                        <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-base sm:text-lg mb-1 ${
                          isActive
                            ? 'text-blue-700 dark:text-blue-400'
                            : isCompleted
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-500'
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-500'
                            : isCompleted
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>

                    {/* Step Number */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.id}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Message */}
            <div className="mt-8 text-center">
              {currentStep < steps.length ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Processing step {currentStep + 1} of {steps.length}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-600 dark:text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Analysis complete! Redirecting to dashboard...</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>AI-Powered Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          This may take a few moments. Please do not close this window.
        </p>
      </div>
    </div>
  );
};

export default ProcessingScreen;
