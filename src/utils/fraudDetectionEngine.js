// FINTRACE AI - Phase-1 Detection Engine
// Frontend-only fraud detection system

/**
 * Main fraud detection function
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Detection results with suspicious accounts and fraud rings
 */
export const detectFraud = (transactions) => {
  console.log('🔍 Starting fraud detection analysis...');
  console.log(`📊 Analyzing ${transactions.length} transactions`);

  // Initialize results
  const suspiciousAccounts = new Map(); // accountId -> { reasons: [], riskScore: 0 }
  const fraudRings = [];
  let ringCounter = 1;

  // Build graph structure
  const graph = buildGraph(transactions);
  const allAccounts = new Set([...graph.keys()]);

  console.log(`👥 Total unique accounts: ${allAccounts.size}`);

  // Detect kingpin before other rules
  console.log('\n👑 Detecting kingpin (likely controller)...');
  const kingpin = detectKingpin(transactions, graph);
  if (kingpin) {
    console.log(`   Kingpin identified: ${kingpin.account_id} (flow: ₹${kingpin.total_flow.toLocaleString()}, connections: ${kingpin.connections})`);
  }

  // RULE 1: Detect Circular Fund Routing (Cycles)
  console.log('\n🔄 RULE 1: Detecting circular fund routing...');
  const cycleRings = detectCycles(graph, transactions);
  cycleRings.forEach(ring => {
    ring.ring_id = `RING_${String(ringCounter).padStart(3, '0')}`;
    ringCounter++;
    fraudRings.push(ring);
    
    // Mark all members as suspicious
    ring.member_accounts.forEach(accountId => {
      addSuspiciousAccount(suspiciousAccounts, accountId, 'cycle', 50);
    });
  });

  // RULE 2: Detect Smurfing Patterns (Fan-In / Fan-Out)
  console.log('\n💸 RULE 2: Detecting smurfing patterns...');
  const smurfingResults = detectSmurfing(transactions);
  
  // Process Fan-In patterns
  smurfingResults.fanIn.forEach(pattern => {
    const ring = {
      ring_id: `RING_${String(ringCounter).padStart(3, '0')}`,
      member_accounts: [pattern.receiver, ...pattern.senders],
      pattern_type: 'fan-in',
      risk_score: 85,
      details: `${pattern.senders.length} senders → 1 receiver in 72h`
    };
    ringCounter++;
    fraudRings.push(ring);
    
    // Mark receiver as suspicious
    addSuspiciousAccount(suspiciousAccounts, pattern.receiver, 'fan-in', 30);
    
    // Mark senders as suspicious too
    pattern.senders.forEach(sender => {
      addSuspiciousAccount(suspiciousAccounts, sender, 'fan-in', 20);
    });
  });

  // Process Fan-Out patterns
  smurfingResults.fanOut.forEach(pattern => {
    const ring = {
      ring_id: `RING_${String(ringCounter).padStart(3, '0')}`,
      member_accounts: [pattern.sender, ...pattern.receivers],
      pattern_type: 'fan-out',
      risk_score: 85,
      details: `1 sender → ${pattern.receivers.length} receivers in 72h`
    };
    ringCounter++;
    fraudRings.push(ring);
    
    // Mark sender as suspicious
    addSuspiciousAccount(suspiciousAccounts, pattern.sender, 'fan-out', 30);
    
    // Mark receivers as suspicious too
    pattern.receivers.forEach(receiver => {
      addSuspiciousAccount(suspiciousAccounts, receiver, 'fan-out', 20);
    });
  });

  // RULE 3: Detect Layered Shell Networks
  console.log('\n🏢 RULE 3: Detecting layered shell networks...');
  const shellNetworks = detectShellNetworks(graph, transactions);
  shellNetworks.forEach(network => {
    const ring = {
      ring_id: `RING_${String(ringCounter).padStart(3, '0')}`,
      member_accounts: network.chain,
      pattern_type: 'shell-network',
      risk_score: 75,
      details: `${network.chain.length}-hop layering chain`
    };
    ringCounter++;
    fraudRings.push(ring);
    
    // Mark intermediate accounts (shell accounts) as suspicious
    network.intermediates.forEach(accountId => {
      addSuspiciousAccount(suspiciousAccounts, accountId, 'shell', 20);
    });
  });

  // Calculate final risk scores (capped at 100)
  const suspiciousAccountsList = Array.from(suspiciousAccounts.entries()).map(([accountId, data]) => ({
    account_id: accountId,
    risk_score: Math.min(data.riskScore, 100),
    reasons: data.reasons,
    patterns_detected: data.reasons.length
  }));

  // Sort by risk score
  suspiciousAccountsList.sort((a, b) => b.risk_score - a.risk_score);
  fraudRings.sort((a, b) => b.risk_score - a.risk_score);

  const summary = {
    total_accounts_analyzed: allAccounts.size,
    suspicious_accounts_flagged: suspiciousAccountsList.length,
    fraud_rings_detected: fraudRings.length,
    patterns_breakdown: {
      cycles: cycleRings.length,
      fan_in: smurfingResults.fanIn.length,
      fan_out: smurfingResults.fanOut.length,
      shell_networks: shellNetworks.length
    }
  };

  console.log('\n✅ Detection complete!');
  console.log(`   Suspicious accounts: ${summary.suspicious_accounts_flagged}`);
  console.log(`   Fraud rings: ${summary.fraud_rings_detected}`);

  return {
    suspicious_accounts: suspiciousAccountsList,
    fraud_rings: fraudRings,
    summary,
    kingpin: kingpin || null
  };
};

/**
 * Detect kingpin (likely controller/mastermind)
 * Based on highest transaction volume and network centrality
 */
const detectKingpin = (transactions, graph) => {
  const accountMetrics = new Map();

  // Calculate metrics for each account
  transactions.forEach(tx => {
    // Sender metrics
    if (!accountMetrics.has(tx.sender_id)) {
      accountMetrics.set(tx.sender_id, {
        totalSent: 0,
        totalReceived: 0,
        connections: new Set()
      });
    }
    const senderMetrics = accountMetrics.get(tx.sender_id);
    senderMetrics.totalSent += tx.amount;
    senderMetrics.connections.add(tx.receiver_id);

    // Receiver metrics
    if (!accountMetrics.has(tx.receiver_id)) {
      accountMetrics.set(tx.receiver_id, {
        totalSent: 0,
        totalReceived: 0,
        connections: new Set()
      });
    }
    const receiverMetrics = accountMetrics.get(tx.receiver_id);
    receiverMetrics.totalReceived += tx.amount;
    receiverMetrics.connections.add(tx.sender_id);
  });

  // Calculate scores for each account
  let bestCandidate = null;
  let bestScore = 0;

  accountMetrics.forEach((metrics, accountId) => {
    const totalFlow = metrics.totalSent + metrics.totalReceived;
    const connectionCount = metrics.connections.size;
    
    // Degree centrality (normalized by max possible connections)
    const degreeCentrality = connectionCount / (accountMetrics.size - 1);
    
    // Combined score: flow amount (70%) + centrality (30%)
    // Normalize flow by dividing by 1M for scoring
    const flowScore = totalFlow / 1000000;
    const centralityScore = degreeCentrality * 100;
    const combinedScore = (flowScore * 0.7) + (centralityScore * 0.3);

    // Must have significant connections (at least 5) to be considered
    if (connectionCount >= 5 && combinedScore > bestScore) {
      bestScore = combinedScore;
      bestCandidate = {
        account_id: accountId,
        total_flow: totalFlow,
        total_sent: metrics.totalSent,
        total_received: metrics.totalReceived,
        connections: connectionCount,
        degree_centrality: degreeCentrality,
        score: combinedScore
      };
    }
  });

  return bestCandidate;
};

/**
 * Build adjacency list graph from transactions
 */
const buildGraph = (transactions) => {
  const graph = new Map();

  transactions.forEach(tx => {
    if (!graph.has(tx.sender_id)) {
      graph.set(tx.sender_id, { outgoing: [], incoming: [], transactions: [] });
    }
    if (!graph.has(tx.receiver_id)) {
      graph.set(tx.receiver_id, { outgoing: [], incoming: [], transactions: [] });
    }

    graph.get(tx.sender_id).outgoing.push(tx.receiver_id);
    graph.get(tx.receiver_id).incoming.push(tx.sender_id);
    graph.get(tx.sender_id).transactions.push(tx);
    graph.get(tx.receiver_id).transactions.push(tx);
  });

  return graph;
};

/**
 * RULE 1: Detect cycles of length 3-5 using DFS
 * Fixed to prevent duplicate cycle detection
 */
const detectCycles = (graph, transactions) => {
  const cycles = [];
  const seenCycles = new Set(); // Track normalized cycles to prevent duplicates

  const normalizeCycle = (cycle) => {
    // Find the smallest node ID in the cycle
    const minNode = cycle.reduce((min, node) => node < min ? node : min, cycle[0]);
    const minIndex = cycle.indexOf(minNode);
    
    // Rotate cycle to start with smallest node
    const rotated = [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)];
    
    // Check both directions (clockwise and counter-clockwise)
    const forward = rotated.join('-');
    const backward = [...rotated].reverse().join('-');
    
    // Return the lexicographically smaller one
    return forward < backward ? forward : backward;
  };

  const dfs = (node, path, pathSet, visited) => {
    if (path.length > 5) return; // Max cycle length is 5

    const neighbors = graph.get(node)?.outgoing || [];
    
    for (const neighbor of neighbors) {
      if (pathSet.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          const cycleLength = cycle.length;
          
          // Only cycles of length 3-5
          if (cycleLength >= 3 && cycleLength <= 5) {
            // Normalize the cycle to prevent duplicates
            const normalizedCycle = normalizeCycle(cycle);
            
            if (!seenCycles.has(normalizedCycle)) {
              seenCycles.add(normalizedCycle);
              cycles.push({
                member_accounts: cycle,
                pattern_type: 'cycle',
                risk_score: 90 + cycleLength, // Higher risk for longer cycles
                details: `${cycleLength}-node circular routing`
              });
            }
          }
        }
      } else if (path.length < 5 && !visited.has(neighbor)) {
        // Continue DFS
        dfs(neighbor, [...path, neighbor], new Set([...pathSet, neighbor]), visited);
      }
    }
  };

  // Start DFS from each node, but mark visited to avoid redundant searches
  const globalVisited = new Set();
  for (const node of graph.keys()) {
    if (!globalVisited.has(node)) {
      dfs(node, [node], new Set([node]), globalVisited);
      globalVisited.add(node);
    }
  }

  console.log(`   Unique cycles found: ${cycles.length} (${seenCycles.size} normalized)`);
  return cycles;
};

/**
 * RULE 2: Detect smurfing patterns (Fan-In and Fan-Out)
 * Time window: 72 hours
 * Fixed to prevent duplicate pattern detection
 */
const detectSmurfing = (transactions) => {
  const TIME_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
  const THRESHOLD = 10; // Minimum 10 connections

  const fanInPatterns = [];
  const fanOutPatterns = [];
  const seenFanIn = new Set();
  const seenFanOut = new Set();

  // Group transactions by receiver (for fan-in)
  const receiverGroups = new Map();
  transactions.forEach(tx => {
    if (!receiverGroups.has(tx.receiver_id)) {
      receiverGroups.set(tx.receiver_id, []);
    }
    receiverGroups.get(tx.receiver_id).push(tx);
  });

  // Check fan-in patterns
  receiverGroups.forEach((txs, receiver) => {
    if (seenFanIn.has(receiver)) return; // Skip if already processed
    
    // Sort by timestamp
    const sortedTxs = txs.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timeA - timeB;
    });
    
    // Sliding window check
    for (let i = 0; i < sortedTxs.length; i++) {
      const windowStart = sortedTxs[i].timestamp instanceof Date 
        ? sortedTxs[i].timestamp 
        : new Date(sortedTxs[i].timestamp);
      const windowEnd = new Date(windowStart.getTime() + TIME_WINDOW_MS);
      
      const txsInWindow = sortedTxs.filter(tx => {
        const txTime = tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp);
        return txTime >= windowStart && txTime <= windowEnd;
      });
      
      const uniqueSenders = new Set(txsInWindow.map(tx => tx.sender_id));
      
      if (uniqueSenders.size >= THRESHOLD) {
        seenFanIn.add(receiver);
        fanInPatterns.push({
          receiver,
          senders: Array.from(uniqueSenders),
          transaction_count: txsInWindow.length,
          time_window: `${windowStart.toISOString()} to ${windowEnd.toISOString()}`
        });
        break; // Found pattern for this receiver, no need to continue
      }
    }
  });

  // Group transactions by sender (for fan-out)
  const senderGroups = new Map();
  transactions.forEach(tx => {
    if (!senderGroups.has(tx.sender_id)) {
      senderGroups.set(tx.sender_id, []);
    }
    senderGroups.get(tx.sender_id).push(tx);
  });

  // Check fan-out patterns
  senderGroups.forEach((txs, sender) => {
    if (seenFanOut.has(sender)) return; // Skip if already processed
    
    // Sort by timestamp
    const sortedTxs = txs.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timeA - timeB;
    });
    
    // Sliding window check
    for (let i = 0; i < sortedTxs.length; i++) {
      const windowStart = sortedTxs[i].timestamp instanceof Date 
        ? sortedTxs[i].timestamp 
        : new Date(sortedTxs[i].timestamp);
      const windowEnd = new Date(windowStart.getTime() + TIME_WINDOW_MS);
      
      const txsInWindow = sortedTxs.filter(tx => {
        const txTime = tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp);
        return txTime >= windowStart && txTime <= windowEnd;
      });
      
      const uniqueReceivers = new Set(txsInWindow.map(tx => tx.receiver_id));
      
      if (uniqueReceivers.size >= THRESHOLD) {
        seenFanOut.add(sender);
        fanOutPatterns.push({
          sender,
          receivers: Array.from(uniqueReceivers),
          transaction_count: txsInWindow.length,
          time_window: `${windowStart.toISOString()} to ${windowEnd.toISOString()}`
        });
        break; // Found pattern for this sender, no need to continue
      }
    }
  });

  console.log(`   Fan-in patterns: ${fanInPatterns.length}, Fan-out patterns: ${fanOutPatterns.length}`);

  return {
    fanIn: fanInPatterns,
    fanOut: fanOutPatterns
  };
};

/**
 * RULE 3: Detect layered shell networks
 * Chains of length >= 3 where intermediates have only 2-3 total transactions
 * Fixed to prevent duplicate/overlapping chain detection
 */
const detectShellNetworks = (graph, transactions) => {
  const shellNetworks = [];
  const seenChains = new Set();

  // Count total transactions per account
  const txCounts = new Map();
  transactions.forEach(tx => {
    txCounts.set(tx.sender_id, (txCounts.get(tx.sender_id) || 0) + 1);
    txCounts.set(tx.receiver_id, (txCounts.get(tx.receiver_id) || 0) + 1);
  });

  // Find chains using DFS
  const findChains = (start, path, visited) => {
    if (path.length >= 3) {
      // Check if intermediates are shell accounts (2-3 transactions only)
      const intermediates = path.slice(1, -1);
      const allShells = intermediates.every(acc => {
        const count = txCounts.get(acc) || 0;
        return count >= 2 && count <= 3;
      });

      if (allShells && intermediates.length > 0) {
        // Normalize chain to prevent duplicates
        const chainKey = path.join('->');
        
        // Check if this chain or any subchain has been seen
        let isDuplicate = false;
        for (const seenChain of seenChains) {
          if (chainKey.includes(seenChain) || seenChain.includes(chainKey)) {
            isDuplicate = true;
            break;
          }
        }
        
        if (!isDuplicate) {
          seenChains.add(chainKey);
          shellNetworks.push({
            chain: path,
            intermediates: intermediates,
            length: path.length
          });
        }
      }
    }

    if (path.length >= 6) return; // Max chain length

    const current = path[path.length - 1];
    const neighbors = graph.get(current)?.outgoing || [];

    for (const neighbor of neighbors) {
      if (!path.includes(neighbor) && !visited.has(neighbor)) {
        const newVisited = new Set(visited);
        newVisited.add(neighbor);
        findChains(start, [...path, neighbor], newVisited);
      }
    }
  };

  // Start from each node, but only explore each path once
  const exploredStarts = new Set();
  for (const node of graph.keys()) {
    if (!exploredStarts.has(node)) {
      const visited = new Set([node]);
      findChains(node, [node], visited);
      exploredStarts.add(node);
    }
  }

  console.log(`   Unique shell networks found: ${shellNetworks.length}`);
  return shellNetworks;
};

/**
 * Helper: Add suspicious account with reason and risk score
 */
const addSuspiciousAccount = (suspiciousAccounts, accountId, reason, riskScore) => {
  if (!suspiciousAccounts.has(accountId)) {
    suspiciousAccounts.set(accountId, {
      reasons: [],
      riskScore: 0
    });
  }

  const account = suspiciousAccounts.get(accountId);
  if (!account.reasons.includes(reason)) {
    account.reasons.push(reason);
  }
  account.riskScore += riskScore;
};

/**
 * Helper: Format detection results for UI display
 */
export const formatDetectionResults = (results) => {
  return {
    statsCards: {
      totalAccounts: results.summary.total_accounts_analyzed,
      suspiciousAccounts: results.summary.suspicious_accounts_flagged,
      fraudRings: results.summary.fraud_rings_detected,
      highRiskAccounts: results.suspicious_accounts.filter(a => a.risk_score >= 80).length
    },
    fraudRingsTable: results.fraud_rings.map(ring => ({
      id: ring.ring_id,
      pattern: ring.pattern_type,
      members: ring.member_accounts.length,
      riskScore: ring.risk_score,
      details: ring.details
    })),
    suspiciousAccountIds: results.suspicious_accounts.map(a => a.account_id),
    fraudRingMap: results.fraud_rings.reduce((map, ring) => {
      ring.member_accounts.forEach(accountId => {
        if (!map[accountId]) {
          map[accountId] = [];
        }
        map[accountId].push(ring.ring_id);
      });
      return map;
    }, {})
  };
};
