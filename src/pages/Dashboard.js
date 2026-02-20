import React, { useState, useMemo } from 'react';
import TransactionGraph from '../components/TransactionGraph';

const Dashboard = ({ darkMode, toggleTheme, onNavigateToUpload, onNavigateToHome, graphData, detectionResults, caseId, transactions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedRing, setHighlightedRing] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [viewMode, setViewMode] = useState('full'); // 'full', 'suspicious', 'rings'
  const [kingpinHighlighted] = useState(false);
  const [replayState, setReplayState] = useState({
    isPlaying: false,
    currentIndex: -1,
    transactions: []
  });
  const [ringFilter, setRingFilter] = useState('all'); // 'all', 'cycle', 'fan-in', 'fan-out', 'shell-network'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Filter graph data based on view mode and replay state
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;

    let filteredNodes = graphData.nodes;
    let filteredLinks = graphData.links;

    // REPLAY MODE: Show only nodes and edges up to current transaction
    if (replayState.currentIndex >= 0 && replayState.transactions.length > 0) {
      // Get transactions that have been replayed so far
      const replayedTransactions = replayState.transactions.slice(0, replayState.currentIndex + 1);
      
      // Collect all accounts involved in replayed transactions
      const replayedAccountIds = new Set();
      replayedTransactions.forEach(tx => {
        replayedAccountIds.add(tx.sender_id);
        replayedAccountIds.add(tx.receiver_id);
      });
      
      // Filter nodes to only show accounts that have been involved
      filteredNodes = graphData.nodes.filter(node => replayedAccountIds.has(node.id));
      
      // Filter links to only show replayed transactions
      filteredLinks = graphData.links.filter((link, index) => {
        // Match by transaction index or by sender/receiver
        if (index < replayState.currentIndex + 1) {
          return true;
        }
        return false;
      });
      
      return {
        nodes: filteredNodes,
        links: filteredLinks
      };
    }

    // NORMAL MODES: Apply view filters
    if (viewMode === 'suspicious') {
      // Show only nodes with risk score > 60
      filteredNodes = graphData.nodes.filter(node => node.risk > 60);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      
      // Show edges connected to suspicious nodes
      filteredLinks = graphData.links.filter(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return nodeIds.has(sourceId) || nodeIds.has(targetId);
      });
    } else if (viewMode === 'rings') {
      // Show only nodes that belong to a fraud ring
      filteredNodes = graphData.nodes.filter(node => node.ring);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      
      // Show only edges between ring members
      filteredLinks = graphData.links.filter(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      });
    }

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [graphData, viewMode, replayState.currentIndex, replayState.transactions]);

  // Calculate unique senders and receivers
  const uniqueSenders = useMemo(() => {
    if (!graphData || !graphData.links) return 0;
    return new Set(graphData.links.map(link => link.source.id || link.source)).size;
  }, [graphData]);

  const uniqueReceivers = useMemo(() => {
    if (!graphData || !graphData.links) return 0;
    return new Set(graphData.links.map(link => link.target.id || link.target)).size;
  }, [graphData]);

  // Use detection results if available, otherwise use defaults
  const stats = detectionResults ? [
    { label: 'Total Transactions', value: graphData?.links?.length || '0', icon: '⚡', color: 'green' },
    { label: 'Unique Senders', value: uniqueSenders, icon: '📤', color: 'blue' },
    { label: 'Unique Receivers', value: uniqueReceivers, icon: '📥', color: 'indigo' },
    { label: 'Suspicious Accounts', value: detectionResults.summary.suspicious_accounts_flagged, icon: '⚠️', color: 'yellow' }
  ] : [
    { label: 'Total Transactions', value: graphData?.links?.length || '0', icon: '⚡', color: 'green' },
    { label: 'Unique Senders', value: uniqueSenders, icon: '📤', color: 'blue' },
    { label: 'Unique Receivers', value: uniqueReceivers, icon: '📥', color: 'indigo' },
    { label: 'Suspicious Accounts', value: graphData?.nodes?.filter(n => n.suspicious).length || '0', icon: '⚠️', color: 'yellow' }
  ];

  // Use detection results for fraud rings table
  const fraudRings = useMemo(() => {
    return detectionResults ? detectionResults.fraud_rings.map(ring => ({
      id: ring.ring_id,
      pattern: ring.pattern_type,
      members: ring.member_accounts.length,
      riskScore: ring.risk_score,
      memberAccounts: ring.member_accounts
    })) : [];
  }, [detectionResults]);

  // Filter fraud rings based on selected filter
  const filteredFraudRings = useMemo(() => {
    if (ringFilter === 'all') return fraudRings;
    return fraudRings.filter(ring => ring.pattern.toLowerCase() === ringFilter);
  }, [fraudRings, ringFilter]);

  // Download HTML Report function
  const handleDownloadHTML = () => {
    try {
      // Create comprehensive HTML report
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FINTRACE AI - Fraud Detection Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            margin: 5px 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
        }
        
        .stat-card.green { border-left-color: #10b981; }
        .stat-card.blue { border-left-color: #3b82f6; }
        .stat-card.indigo { border-left-color: #6366f1; }
        .stat-card.yellow { border-left-color: #f59e0b; }
        
        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #111827;
        }
        
        .section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .section h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #111827;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        thead {
            background: #f3f4f6;
            border-bottom: 2px solid #d1d5db;
        }
        
        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #374151;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tbody tr:hover {
            background: #f9fafb;
        }
        
        .risk-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }
        
        .risk-high {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .risk-medium {
            background: #fed7aa;
            color: #c2410c;
        }
        
        .risk-low {
            background: #fef3c7;
            color: #d97706;
        }
        
        .summary-box {
            background: #f0f9ff;
            border-left: 4px solid #0284c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .summary-box h3 {
            color: #0c4a6e;
            margin-bottom: 10px;
        }
        
        .summary-box p {
            color: #0c4a6e;
            margin: 5px 0;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #6b7280;
            border-top: 2px solid #e5e7eb;
            margin-top: 40px;
        }
        
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
        
        .timestamp {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 10px;
        }
        
        @media print {
            body { background: white; }
            .container { padding: 0; }
            .section { box-shadow: none; border: 1px solid #e5e7eb; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔍 FINTRACE AI</h1>
            <p>Fraud Detection & Financial Forensics Report</p>
            <p>Case ID: <strong>${caseId || 'N/A'}</strong></p>
            <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card green">
                <div class="stat-label">⚡ Total Transactions</div>
                <div class="stat-value">${graphData?.links?.length || 0}</div>
            </div>
            <div class="stat-card blue">
                <div class="stat-label">📤 Unique Senders</div>
                <div class="stat-value">${uniqueSenders}</div>
            </div>
            <div class="stat-card indigo">
                <div class="stat-label">📥 Unique Receivers</div>
                <div class="stat-value">${uniqueReceivers}</div>
            </div>
            <div class="stat-card yellow">
                <div class="stat-label">⚠️ Suspicious Accounts</div>
                <div class="stat-value">${detectionResults?.summary.suspicious_accounts_flagged || 0}</div>
            </div>
        </div>
        
        <!-- Summary Section -->
        <div class="section">
            <h2>📊 Analysis Summary</h2>
            <div class="summary-box">
                <h3>Detection Results</h3>
                <p><strong>Fraud Rings Detected:</strong> ${fraudRings.length}</p>
                <p><strong>Suspicious Accounts:</strong> ${detectionResults?.summary.suspicious_accounts_flagged || 0}</p>
                <p><strong>Total Transactions Analyzed:</strong> ${graphData?.links?.length || 0}</p>
                ${detectionResults?.kingpin ? `<p><strong>Kingpin Identified:</strong> ${detectionResults.kingpin.account_id}</p>` : ''}
            </div>
        </div>
        
        <!-- Fraud Rings Table -->
        <div class="section">
            <h2>🔴 Detected Fraud Rings (${fraudRings.length})</h2>
            ${fraudRings.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Ring ID</th>
                            <th>Pattern Type</th>
                            <th>Members</th>
                            <th>Risk Score</th>
                            <th>Accounts</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${fraudRings.map(ring => `
                            <tr>
                                <td><strong>${ring.id}</strong></td>
                                <td>${ring.pattern}</td>
                                <td>${ring.members}</td>
                                <td>
                                    <span class="risk-badge ${ring.riskScore >= 90 ? 'risk-high' : ring.riskScore >= 75 ? 'risk-medium' : 'risk-low'}">
                                        ${ring.riskScore}%
                                    </span>
                                </td>
                                <td><code>${ring.memberAccounts.join(', ')}</code></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color: #6b7280;">No fraud rings detected in this analysis.</p>'}
        </div>
        
        <!-- Suspicious Accounts -->
        <div class="section">
            <h2>⚠️ Suspicious Accounts</h2>
            ${detectionResults?.suspicious_accounts && detectionResults.suspicious_accounts.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Account ID</th>
                            <th>Risk Score</th>
                            <th>Reasons</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detectionResults.suspicious_accounts.slice(0, 50).map(acc => `
                            <tr>
                                <td><strong>${acc.account_id}</strong></td>
                                <td>
                                    <span class="risk-badge ${acc.risk_score >= 90 ? 'risk-high' : acc.risk_score >= 75 ? 'risk-medium' : 'risk-low'}">
                                        ${acc.risk_score}%
                                    </span>
                                </td>
                                <td>${acc.reasons.join(', ')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p style="color: #6b7280;">No suspicious accounts flagged.</p>'}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>FINTRACE AI</strong> - Advanced Fraud Detection System</p>
            <p>This report is confidential and intended for authorized personnel only.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                For questions or concerns, please contact the Financial Forensics team.
            </p>
        </div>
    </div>
</body>
</html>
      `;
      
      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fraud-report-${caseId || 'case'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating HTML report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  // Generate Case Video function (placeholder for future integration)
  const handleGenerateCaseVideo = () => {
    alert('🎬 Case Video Generation\n\nDue to time constraints, video generation integration is pending.\n\nThis feature will:\n• Create an animated replay of all transactions\n• Show fraud ring detection process\n• Include analysis timeline\n• Export as MP4 video\n\nPlease check back soon!');
  };

  const getRiskColor = (score) => {
    if (score >= 90) return 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20';
    if (score >= 75) return 'text-orange-600 dark:text-orange-500 bg-orange-50 dark:bg-orange-900/20';
    return 'text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleRingClick = (ring) => {
    // Toggle highlighting - pass the ring object with member accounts
    if (highlightedRing && highlightedRing.id === ring.id) {
      setHighlightedRing(null);
    } else {
      setHighlightedRing(ring);
    }
  };

  const handleClearRingHighlight = () => {
    setHighlightedRing(null);
  };

  const handleReplayToggle = () => {
    if (replayState.isPlaying) {
      // Pause
      setReplayState(prev => ({ ...prev, isPlaying: false }));
    } else {
      // Start or resume
      if (replayState.currentIndex === -1) {
        // Start from beginning with actual transactions
        if (transactions && transactions.length > 0) {
          console.log('Starting replay with', transactions.length, 'transactions');
          setReplayState({
            isPlaying: true,
            currentIndex: 0,
            transactions: transactions
          });
        } else {
          alert('No transactions available to replay');
        }
      } else {
        // Resume
        setReplayState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  };

  const handleReplayStop = () => {
    setReplayState({
      isPlaying: false,
      currentIndex: -1,
      transactions: []
    });
  };

  // Replay animation effect
  React.useEffect(() => {
    if (replayState.isPlaying && replayState.currentIndex >= 0 && replayState.transactions.length > 0) {
      if (replayState.currentIndex < replayState.transactions.length) {
        const timer = setTimeout(() => {
          setReplayState(prev => ({
            ...prev,
            currentIndex: prev.currentIndex + 1
          }));
        }, 200); // 200ms delay per transaction

        return () => clearTimeout(timer);
      } else {
        // Replay finished
        console.log('Replay finished');
        setReplayState(prev => ({ ...prev, isPlaying: false }));
      }
    }
  }, [replayState.isPlaying, replayState.currentIndex, replayState.transactions.length]);

  const handleDownloadJSON = () => {
    if (!detectionResults) return;

    // Prepare data for export
    const exportData = {
      suspicious_accounts: detectionResults.suspicious_accounts,
      fraud_rings: detectionResults.fraud_rings,
      summary: detectionResults.summary,
      kingpin: detectionResults.kingpin || null,
      timestamp: new Date().toISOString(),
      case_id: 'INV-2024-0847'
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'case_result.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo and Case Name */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-black text-gray-900 dark:text-white">
                    FINTRACE AI
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Case: {caseId || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
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
                onClick={onNavigateToHome}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </button>
              
              <button
                onClick={onNavigateToUpload}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-all duration-200 text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                New Case
              </button>

              <button
                onClick={handleDownloadHTML}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Report
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Stats Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Graph Area (70%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search account ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200">
                Search
              </button>
            </div>

            {/* Graph View Mode Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Graph View:
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('full')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'full'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                      Full Network
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setViewMode('suspicious')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'suspicious'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                      Suspicious Only
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setViewMode('rings')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'rings'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                      Fraud Rings Only
                    </div>
                  </button>
                </div>
              </div>
              
              {/* View mode description */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {viewMode === 'full' && '📊 Showing all accounts and transactions in the network'}
                  {viewMode === 'suspicious' && '⚠️ Showing only high-risk accounts (risk score > 60) and their connections'}
                  {viewMode === 'rings' && '🔴 Showing only accounts belonging to detected fraud rings'}
                </p>
              </div>
            </div>

              {/* Graph Visualization Area */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Transaction Network
                  </h2>
                  <div className="flex items-center gap-2">
                    {replayState.isPlaying && (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full border border-yellow-300 dark:border-yellow-700 animate-pulse">
                        ▶️ Replaying...
                      </span>
                    )}
                    {viewMode === 'suspicious' && (
                      <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full border border-orange-300 dark:border-orange-700">
                        ⚠️ Suspicious View
                      </span>
                    )}
                    {viewMode === 'rings' && (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full border border-red-300 dark:border-red-700">
                        🔴 Rings View
                      </span>
                    )}
                    {heatmapMode && (
                      <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full border border-orange-300 dark:border-orange-700">
                        🔥 Heatmap Active
                      </span>
                    )}
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                      Live
                    </span>
                  </div>
                </div>
                
                {/* Graph Component */}
                <div style={{ height: '500px' }}>
                  <TransactionGraph 
                    darkMode={darkMode}
                    onNodeClick={handleNodeClick}
                    highlightedRing={highlightedRing}
                    graphData={filteredGraphData}
                    heatmapMode={heatmapMode}
                    viewMode={viewMode}
                    kingpinHighlighted={kingpinHighlighted}
                    replayState={replayState}
                  />
                </div>
              </div>

            {/* Fraud Ring Table / Replay Transaction View */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              {replayState.isPlaying || replayState.currentIndex >= 0 ? (
                /* Replay Transaction View */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="animate-pulse">▶️</span>
                      Replay Mode - Transaction Details
                    </h2>
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-semibold rounded-full">
                      {replayState.currentIndex + 1} / {replayState.transactions.length}
                    </span>
                  </div>
                  
                  {replayState.currentIndex >= 0 && replayState.transactions[replayState.currentIndex] ? (
                    <div className="space-y-4">
                      {/* Current Transaction Card */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Transaction</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transaction ID</p>
                            <p className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {replayState.transactions[replayState.currentIndex].transaction_id}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              ₹{replayState.transactions[replayState.currentIndex].amount?.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">From (Sender)</p>
                            <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                              {replayState.transactions[replayState.currentIndex].sender_id}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">To (Receiver)</p>
                            <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                              {replayState.transactions[replayState.currentIndex].receiver_id}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Timestamp</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {replayState.transactions[replayState.currentIndex].timestamp?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Replay History */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 max-h-64 overflow-y-auto">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Transaction History</h4>
                        <div className="space-y-2">
                          {replayState.transactions.slice(0, replayState.currentIndex + 1).reverse().slice(0, 10).map((tx, idx) => {
                            const actualIndex = replayState.currentIndex - idx;
                            const isCurrent = idx === 0;
                            return (
                              <div 
                                key={actualIndex}
                                className={`p-3 rounded-lg border ${
                                  isCurrent 
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{actualIndex + 1}</span>
                                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{tx.transaction_id}</span>
                                  </div>
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                    ₹{tx.amount?.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                  <span>{tx.sender_id}</span>
                                  <span>→</span>
                                  <span>{tx.receiver_id}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">Click "Replay Transactions" to start</p>
                    </div>
                  )}
                </>
              ) : (
                /* Normal Fraud Rings Table */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Detected Fraud Rings ({filteredFraudRings.length})
                    </h2>
                    <div className="flex items-center gap-2">
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                    </button>
                    
                    {showFilterDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                        <button
                          onClick={() => { setRingFilter('all'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${ringFilter === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          All Rings
                        </button>
                        <button
                          onClick={() => { setRingFilter('cycle'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${ringFilter === 'cycle' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          🔄 Cycles
                        </button>
                        <button
                          onClick={() => { setRingFilter('fan-in'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${ringFilter === 'fan-in' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          📥 Fan-In
                        </button>
                        <button
                          onClick={() => { setRingFilter('fan-out'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${ringFilter === 'fan-out' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          📤 Fan-Out
                        </button>
                        <button
                          onClick={() => { setRingFilter('shell-network'); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-lg ${ringFilter === 'shell-network' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          🏢 Shell Networks
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {highlightedRing && (
                    <button
                      onClick={handleClearRingHighlight}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              {filteredFraudRings.length > 0 ? (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Ring ID
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Pattern Type
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Members
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Risk Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFraudRings.map((ring) => (
                        <tr
                          key={ring.id}
                          onClick={() => handleRingClick(ring)}
                          className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 ${
                            highlightedRing && highlightedRing.id === ring.id 
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500' 
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {highlightedRing && highlightedRing.id === ring.id && (
                                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {ring.id}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {ring.pattern}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                            {ring.members}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getRiskColor(ring.riskScore)}`}>
                              {ring.riskScore}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {ringFilter === 'all' ? 'No fraud rings detected' : `No ${ringFilter} patterns detected`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {ringFilter === 'all' ? 'Upload transaction data to run detection' : 'Try selecting a different filter'}
                  </p>
                </div>
              )}
            </>
          )}
            </div>
          </div>

          {/* Right: Side Panel (30%) */}
          <div className="space-y-6">
            {/* Account Investigation Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Account Investigation
              </h2>
              
              {selectedNode ? (
                <div className="space-y-4">
                  {/* Kingpin Badge */}
                  {selectedNode.isKingpin && (
                    <div className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl p-4 border-2 border-yellow-400 dark:border-yellow-600">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">👑</span>
                        <div>
                          <div className="text-sm font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide">
                            Likely Controller / Kingpin
                          </div>
                          <div className="text-xs text-yellow-700 dark:text-yellow-400">
                            Highest transaction volume & network centrality
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-2xl font-black text-gray-900 dark:text-white">
                        {selectedNode.id}
                      </span>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                      selectedNode.risk >= 80 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : selectedNode.risk >= 50
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      Risk Score: {selectedNode.risk}%
                    </span>
                  </div>

                  {/* Account Details */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Role</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{selectedNode.role}</div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Amount</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        ${selectedNode.amount?.toLocaleString()}
                      </div>
                    </div>

                    {selectedNode.isKingpin && selectedNode.kingpinData && (
                      <>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                          <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">Total Flow (Sent + Received)</div>
                          <div className="font-bold text-lg text-yellow-800 dark:text-yellow-300">
                            ${selectedNode.kingpinData.total_flow?.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                          <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">Network Connections</div>
                          <div className="font-bold text-lg text-yellow-800 dark:text-yellow-300">
                            {selectedNode.kingpinData.connections} accounts
                          </div>
                          <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                            Centrality: {(selectedNode.kingpinData.degree_centrality * 100).toFixed(1)}%
                          </div>
                        </div>
                      </>
                    )}

                    {selectedNode.ring && (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fraud Ring</div>
                        <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {selectedNode.ring}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</div>
                      <div className={`font-semibold ${
                        selectedNode.suspicious 
                          ? 'text-red-600 dark:text-red-500' 
                          : 'text-green-600 dark:text-green-500'
                      }`}>
                        {selectedNode.suspicious ? '⚠️ Suspicious Activity' : '✓ Normal Activity'}
                      </div>
                    </div>

                    {/* Detection Patterns */}
                    {detectionResults && selectedNode.suspicious && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Detected Patterns</div>
                        {(() => {
                          const suspiciousAccount = detectionResults.suspicious_accounts.find(
                            acc => acc.account_id === selectedNode.id
                          );
                          if (suspiciousAccount) {
                            return (
                              <div className="space-y-1">
                                {suspiciousAccount.reasons.map((reason, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="text-red-600 dark:text-red-400">•</span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                      {reason === 'cycle' && 'Circular Fund Routing'}
                                      {reason === 'fan-in' && 'Fan-In Pattern (Smurfing)'}
                                      {reason === 'fan-out' && 'Fan-Out Pattern (Smurfing)'}
                                      {reason === 'shell' && 'Shell Network Layer'}
                                    </span>
                                  </div>
                                ))}
                                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {suspiciousAccount.patterns_detected} pattern(s) detected
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return <span className="text-sm text-gray-600 dark:text-gray-400">No patterns available</span>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Removed View Full Report button */}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center" style={{ minHeight: '300px' }}>
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Click a node to view details
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Account information will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Controls Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Controls
              </h2>
              
              <div className="space-y-3">
                {/* Heatmap Toggle Button */}
                <button 
                  onClick={() => setHeatmapMode(!heatmapMode)}
                  className={`w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    heatmapMode
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {heatmapMode ? 'Heatmap: ON' : 'Toggle Heatmap'}
                </button>
                
                {/* Replay Controls */}
                <div className="space-y-2">
                  <button
                    onClick={handleReplayToggle}
                    disabled={!transactions || transactions.length === 0}
                    className={`w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                      !transactions || transactions.length === 0
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : replayState.isPlaying
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title={!transactions || transactions.length === 0 ? 'No transactions available' : 'Click to replay transactions'}
                  >
                    {replayState.isPlaying ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Pause Replay
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        {replayState.currentIndex === -1 ? 'Replay Transactions' : 'Resume Replay'}
                      </>
                    )}
                  </button>
                  
                  {replayState.currentIndex >= 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={handleReplayStop}
                        className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        Stop & Reset
                      </button>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Progress</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {replayState.currentIndex} / {replayState.transactions.length}
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                            style={{ 
                              width: `${(replayState.currentIndex / replayState.transactions.length) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleDownloadJSON}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download JSON
                </button>
                
                <button 
                  onClick={handleGenerateCaseVideo}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Generate Case Video
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="text-lg font-bold mb-4">Investigation Summary</h3>
              <div className="space-y-3">
                {detectionResults ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Cycles Detected</span>
                      <span className="font-bold text-xl">{detectionResults.summary.patterns_breakdown.cycles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Fan-In Patterns</span>
                      <span className="font-bold text-xl">{detectionResults.summary.patterns_breakdown.fan_in}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Fan-Out Patterns</span>
                      <span className="font-bold text-xl">{detectionResults.summary.patterns_breakdown.fan_out}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Shell Networks</span>
                      <span className="font-bold text-xl">{detectionResults.summary.patterns_breakdown.shell_networks}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">High Risk Accounts</span>
                      <span className="font-bold text-xl">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Total Transactions</span>
                      <span className="font-bold text-xl">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-100">Flagged Amount</span>
                      <span className="font-bold text-xl">-</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
