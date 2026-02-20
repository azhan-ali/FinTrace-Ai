import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SocialProof from './components/SocialProof';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import TargetUsers from './components/TargetUsers';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import CaseUpload from './pages/CaseUpload';
import ProcessingScreen from './pages/ProcessingScreen';
import Dashboard from './pages/Dashboard';
import { buildGraphData, generateMockCSV } from './utils/csvParser';
import { detectFraud, formatDetectionResults } from './utils/fraudDetectionEngine';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'upload', 'processing', 'dashboard'
  const [graphData, setGraphData] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Generate unique case ID
  const generateCaseId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CASE-${timestamp}-${random}`;
  };

  // Save case to localStorage
  const saveCaseToHistory = (caseId, results, transactions) => {
    const caseData = {
      caseId: caseId,
      timestamp: new Date().toLocaleString(),
      totalAccounts: results.summary.total_accounts_analyzed,
      suspiciousAccounts: results.summary.suspicious_accounts_flagged,
      fraudRings: results.summary.fraud_rings_detected,
      detectionResults: results,
      transactions: transactions
    };

    // Get existing history
    const history = JSON.parse(localStorage.getItem('caseHistory') || '[]');
    
    // Add new case at the beginning
    history.unshift(caseData);
    
    // Keep only last 20 cases
    const trimmedHistory = history.slice(0, 20);
    
    // Save back to localStorage
    localStorage.setItem('caseHistory', JSON.stringify(trimmedHistory));
    
    console.log('✅ Case saved to history:', caseId);
  };

  // Load case from history
  const loadCaseFromHistory = (caseItem) => {
    console.log('📂 Loading case from history:', caseItem.caseId);
    console.log('📊 Case has', caseItem.totalAccounts, 'accounts');
    console.log('⚠️ WARNING: Loading OLD case from localStorage!');
    
    setCurrentCaseId(caseItem.caseId);
    
    // Rebuild graph data
    const data = buildGraphData(
      caseItem.transactions,
      caseItem.detectionResults.suspicious_accounts.map(a => a.account_id),
      caseItem.detectionResults.fraud_rings,
      caseItem.detectionResults.kingpin
    );
    
    setGraphData(data);
    setDetectionResults(caseItem.detectionResults);
    setAllTransactions(caseItem.transactions); // Set transactions for replay
    setCurrentPage('dashboard');
    window.scrollTo(0, 0);
  };

  // Handle file upload from Hero
  const handleFileUploadFromHero = (file) => {
    setUploadedFile(file);
    setCurrentPage('processing');
    window.scrollTo(0, 0);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const navigateToUpload = () => {
    setCurrentPage('upload');
    window.scrollTo(0, 0);
  };

  const navigateToHome = () => {
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  const navigateToProcessing = (file) => {
    setUploadedFile(file);
    setCurrentPage('processing');
    window.scrollTo(0, 0);
  };

  const navigateToDashboard = () => {
    console.log('🚀 navigateToDashboard called');
    console.log('📁 uploadedFile:', uploadedFile);
    
    // Process the uploaded file or use demo data
    try {
      if (uploadedFile && uploadedFile.demo) {
        console.log('📦 Using demo data');
        // Use demo data
        const csvText = generateMockCSV();
        processCSVText(csvText);
      } else if (uploadedFile) {
        console.log('📄 Processing uploaded file:', uploadedFile.name);
        // Parse actual uploaded file using PapaParse
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false, // Keep as strings initially for better control
          complete: function(results) {
            console.log('📄 PapaParse - Raw CSV rows parsed:', results.data.length);
            console.log('📋 First row sample:', results.data[0]);
            
            // Helper function to parse custom date format
            // Supports: YYYY-MM-DD H:mm:ss, DD-MM-YYYY HH:mm:ss, DD-MM-YYYY HH:mm
            const parseCustomDate = (str) => {
              if (!str) return null;
              try {
                const [datePart, timePart] = str.trim().split(" ");
                
                // Detect format by checking if first part is 4 digits (year) or 2 digits (day)
                const dateParts = datePart.split("-");
                let year, month, day;
                
                if (dateParts[0].length === 4) {
                  // YYYY-MM-DD format
                  year = dateParts[0];
                  month = dateParts[1];
                  day = dateParts[2];
                } else {
                  // DD-MM-YYYY format
                  day = dateParts[0];
                  month = dateParts[1];
                  year = dateParts[2];
                }
                
                const timeParts = timePart.split(":");
                const hour = timeParts[0];
                const minute = timeParts[1];
                const second = timeParts[2] || '0'; // Default to 0 if seconds not provided
                
                return new Date(
                  Number(year),
                  Number(month) - 1, // Month is 0-indexed
                  Number(day),
                  Number(hour),
                  Number(minute),
                  Number(second)
                );
              } catch (error) {
                console.warn('Failed to parse timestamp:', str, error);
                return new Date(); // Fallback to current date
              }
            };
            
            // Convert to transaction format
            const transactions = results.data
              .filter(row => {
                // Only skip completely empty rows
                return row.transaction_id || row.sender_id || row.receiver_id || row.amount || row.timestamp;
              })
              .map(row => ({
                transaction_id: String(row.transaction_id || '').trim(),
                sender_id: String(row.sender_id || '').trim(),
                receiver_id: String(row.receiver_id || '').trim(),
                amount: parseFloat(row.amount) || 0,
                timestamp: parseCustomDate(row.timestamp),
                timestamp_str: String(row.timestamp || '').trim() // Keep original for reference
              }))
              .filter(tx => {
                // Only filter out transactions with missing critical data
                return tx.transaction_id && tx.sender_id && tx.receiver_id && tx.amount > 0 && tx.timestamp;
              });
            
            // Sort transactions by timestamp
            transactions.sort((a, b) => a.timestamp - b.timestamp);
            
            console.log('✅ Transactions after processing:', transactions.length);
            console.log('📊 Sample transaction:', transactions[0]);
            console.log('📅 Date range:', 
              transactions[0]?.timestamp?.toISOString(), 
              'to', 
              transactions[transactions.length - 1]?.timestamp?.toISOString()
            );
            
            if (transactions.length === 0) {
              throw new Error('No valid transactions found in CSV file');
            }
            
            processTransactions(transactions);
          },
          error: function(error) {
            console.error('❌ PapaParse error:', error);
            alert('Error parsing CSV: ' + error.message);
          }
        });
      } else {
        // Fallback to demo data
        const csvText = generateMockCSV();
        processCSVText(csvText);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file: ' + error.message);
    }
  };

  const processCSVText = (csvText) => {
    // Helper function to parse custom date format
    // Supports: YYYY-MM-DD H:mm:ss, DD-MM-YYYY HH:mm:ss, DD-MM-YYYY HH:mm
    const parseCustomDate = (str) => {
      if (!str) return null;
      try {
        const [datePart, timePart] = str.trim().split(" ");
        
        // Detect format by checking if first part is 4 digits (year) or 2 digits (day)
        const dateParts = datePart.split("-");
        let year, month, day;
        
        if (dateParts[0].length === 4) {
          // YYYY-MM-DD format
          year = dateParts[0];
          month = dateParts[1];
          day = dateParts[2];
        } else {
          // DD-MM-YYYY format
          day = dateParts[0];
          month = dateParts[1];
          year = dateParts[2];
        }
        
        const timeParts = timePart.split(":");
        const hour = timeParts[0];
        const minute = timeParts[1];
        const second = timeParts[2] || '0'; // Default to 0 if seconds not provided
        
        return new Date(
          Number(year),
          Number(month) - 1, // Month is 0-indexed
          Number(day),
          Number(hour),
          Number(minute),
          Number(second)
        );
      } catch (error) {
        console.warn('Failed to parse timestamp:', str, error);
        return new Date(); // Fallback to current date
      }
    };
    
    // Parse CSV text using PapaParse
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: function(results) {
        console.log('📄 Demo CSV rows parsed:', results.data.length);
        
        const transactions = results.data
          .filter(row => row.transaction_id && row.sender_id && row.receiver_id)
          .map(row => ({
            transaction_id: String(row.transaction_id).trim(),
            sender_id: String(row.sender_id).trim(),
            receiver_id: String(row.receiver_id).trim(),
            amount: parseFloat(row.amount),
            timestamp: parseCustomDate(row.timestamp),
            timestamp_str: String(row.timestamp).trim()
          }));
        
        // Sort transactions by timestamp
        transactions.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log('✅ Demo transactions:', transactions.length);
        processTransactions(transactions);
      }
    });
  };

  const processTransactions = (transactions) => {
    console.log('\n🚀 Running fraud detection engine...');
    console.log(`📊 Input: ${transactions.length} transactions`);
    console.log('📋 First 3 transactions:', transactions.slice(0, 3));
    
    // Store transactions for replay
    setAllTransactions(transactions);
    
    // Generate case ID
    const caseId = generateCaseId();
    setCurrentCaseId(caseId);
    
    // Run fraud detection engine
    const fraudResults = detectFraud(transactions);
    const formattedResults = formatDetectionResults(fraudResults);
    
    console.log('\n📊 Detection Results:');
    console.log(`   Case ID: ${caseId}`);
    console.log(`   Total accounts analyzed: ${fraudResults.summary.total_accounts_analyzed}`);
    console.log(`   Suspicious accounts: ${fraudResults.summary.suspicious_accounts_flagged}`);
    console.log(`   Fraud rings: ${fraudResults.summary.fraud_rings_detected}`);
    console.log(`   Patterns: Cycles=${fraudResults.summary.patterns_breakdown.cycles}, Fan-In=${fraudResults.summary.patterns_breakdown.fan_in}, Fan-Out=${fraudResults.summary.patterns_breakdown.fan_out}, Shells=${fraudResults.summary.patterns_breakdown.shell_networks}`);
    if (fraudResults.kingpin) {
      console.log(`   Kingpin: ${fraudResults.kingpin.account_id}`);
    }
    
    // Save case to history
    saveCaseToHistory(caseId, fraudResults, transactions);
    
    // Build graph data with detection results
    const data = buildGraphData(
      transactions, 
      formattedResults.suspiciousAccountIds,
      fraudResults.fraud_rings,
      fraudResults.kingpin
    );
    
    console.log(`\n📈 Graph data built: ${data.nodes.length} nodes, ${data.links.length} links`);
    console.log(`   Suspicious nodes: ${data.nodes.filter(n => n.suspicious).length}`);
    console.log(`   ✅ UNIQUE ACCOUNTS FROM TRANSACTIONS: ${new Set([...transactions.map(t => t.sender_id), ...transactions.map(t => t.receiver_id)]).size}`);
    
    setGraphData(data);
    setDetectionResults(fraudResults);
    setCurrentPage('dashboard');
    window.scrollTo(0, 0);
  };

  // Render different pages based on currentPage state
  if (currentPage === 'upload') {
    return (
      <CaseUpload
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        onNavigateHome={navigateToHome}
        onNavigateToProcessing={navigateToProcessing}
      />
    );
  }

  if (currentPage === 'processing') {
    return (
      <ProcessingScreen
        darkMode={darkMode}
        onNavigateToDashboard={navigateToDashboard}
      />
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <Dashboard
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        onNavigateToUpload={navigateToUpload}
        onNavigateToHome={navigateToHome}
        graphData={graphData}
        detectionResults={detectionResults}
        caseId={currentCaseId}
        transactions={allTransactions}
      />
    );
  }

  // Home page (landing page)
  return (
    <div className="min-h-screen dotted-background transition-colors duration-300">
      <Navbar darkMode={darkMode} toggleTheme={toggleTheme} onNavigateToUpload={navigateToUpload} />
      <Hero 
        onNavigateToUpload={navigateToUpload} 
        onLoadCase={loadCaseFromHistory}
        onFileUpload={handleFileUploadFromHero}
      />
      <SocialProof />
      <Features />
      <Testimonials />
      <TargetUsers />
      <CTASection onNavigateToUpload={navigateToUpload} />
      <Footer />
    </div>
  );
}

export default App;
