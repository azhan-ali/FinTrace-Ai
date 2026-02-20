// CSV Parser utility for transaction data
// Note: CSV parsing is now handled by PapaParse in App.js
// This file contains graph building and demo data generation functions

// Build graph data from transactions
export const buildGraphData = (transactions, suspiciousAccounts = [], fraudRings = [], kingpin = null) => {
  // Extract unique accounts
  const accountsMap = new Map();
  const linksMap = new Map();

  transactions.forEach(tx => {
    // Add sender
    if (!accountsMap.has(tx.sender_id)) {
      accountsMap.set(tx.sender_id, {
        id: tx.sender_id,
        totalSent: 0,
        totalReceived: 0,
        transactionCount: 0,
        suspicious: false,
        ring: null,
        role: 'Normal'
      });
    }

    // Add receiver
    if (!accountsMap.has(tx.receiver_id)) {
      accountsMap.set(tx.receiver_id, {
        id: tx.receiver_id,
        totalSent: 0,
        totalReceived: 0,
        transactionCount: 0,
        suspicious: false,
        ring: null,
        role: 'Normal'
      });
    }

    // Update sender stats
    const sender = accountsMap.get(tx.sender_id);
    sender.totalSent += tx.amount;
    sender.transactionCount++;

    // Update receiver stats
    const receiver = accountsMap.get(tx.receiver_id);
    receiver.totalReceived += tx.amount;
    receiver.transactionCount++;

    // Create link (aggregate multiple transactions between same accounts)
    const linkKey = `${tx.sender_id}->${tx.receiver_id}`;
    if (!linksMap.has(linkKey)) {
      linksMap.set(linkKey, {
        source: tx.sender_id,
        target: tx.receiver_id,
        value: 0,
        count: 0
      });
    }
    
    const link = linksMap.get(linkKey);
    link.value += tx.amount;
    link.count++;
  });

  // Mark suspicious accounts
  if (Array.isArray(suspiciousAccounts)) {
    suspiciousAccounts.forEach(suspiciousId => {
      if (accountsMap.has(suspiciousId)) {
        accountsMap.get(suspiciousId).suspicious = true;
      }
    });
  }

  // Assign fraud rings and roles
  if (Array.isArray(fraudRings) && fraudRings.length > 0) {
    fraudRings.forEach(ring => {
      // Handle both old format and new format
      const members = ring.member_accounts || ring.members || [];
      const ringId = ring.ring_id || ring.id;
      const roles = ring.roles || {};
      
      // Ensure members is an array
      if (Array.isArray(members)) {
        members.forEach(memberId => {
          if (accountsMap.has(memberId)) {
            const account = accountsMap.get(memberId);
            account.ring = ringId;
            account.role = roles[memberId] || 'Mule';
            account.suspicious = true;
          }
        });
      }
    });
  }

  // Calculate risk scores based on transaction patterns
  accountsMap.forEach((account, id) => {
    let riskScore = 0;

    // High transaction volume increases risk
    if (account.transactionCount > 50) riskScore += 30;
    else if (account.transactionCount > 20) riskScore += 15;

    // Large amounts increase risk
    const totalAmount = account.totalSent + account.totalReceived;
    if (totalAmount > 500000) riskScore += 40;
    else if (totalAmount > 100000) riskScore += 20;

    // Imbalanced flow (more sent than received or vice versa)
    const ratio = account.totalSent / (account.totalReceived + 1);
    if (ratio > 5 || ratio < 0.2) riskScore += 20;

    // If marked suspicious, boost risk score
    if (account.suspicious) {
      riskScore = Math.max(riskScore, 70);
      riskScore += 15;
    }

    // Mark kingpin
    if (kingpin && kingpin.account_id === id) {
      account.isKingpin = true;
      account.kingpinData = {
        total_flow: kingpin.total_flow,
        connections: kingpin.connections,
        degree_centrality: kingpin.degree_centrality
      };
      // Kingpins are always suspicious
      account.suspicious = true;
      riskScore = Math.max(riskScore, 95);
    }

    account.risk = Math.min(Math.round(riskScore), 99);
    account.amount = totalAmount;
  });

  return {
    nodes: Array.from(accountsMap.values()),
    links: Array.from(linksMap.values())
  };
};

// Generate mock CSV data for demo with MORE transactions for dense network
export const generateMockCSV = () => {
  const csv = `transaction_id,sender_id,receiver_id,amount,timestamp
TX_001,A1,A2,125000,2024-01-15 10:23:45
TX_002,A1,A3,98000,2024-01-15 10:45:12
TX_003,A1,A4,76000,2024-01-15 11:02:33
TX_004,A2,A5,120000,2024-01-15 11:30:21
TX_005,A3,A5,95000,2024-01-15 12:15:44
TX_006,A4,A5,73000,2024-01-15 12:45:09
TX_007,B1,B2,95000,2024-01-15 13:20:15
TX_008,B1,B3,110000,2024-01-15 13:55:32
TX_009,B2,B4,90000,2024-01-15 14:10:48
TX_010,B3,B4,105000,2024-01-15 14:35:21
TX_011,C1,C2,45000,2024-01-15 15:05:33
TX_012,C1,C3,52000,2024-01-15 15:30:12
TX_013,C1,C4,38000,2024-01-15 16:00:45
TX_014,A5,N1,5000,2024-01-15 16:25:18
TX_015,B4,N2,8500,2024-01-15 16:50:29
TX_016,C4,N3,6200,2024-01-15 17:15:41
TX_017,N1,N4,4100,2024-01-15 17:40:55
TX_018,N2,N5,9800,2024-01-15 18:05:12
TX_019,N3,N6,7300,2024-01-15 18:30:33
TX_020,N5,N7,5900,2024-01-15 19:00:21
TX_021,A2,B2,15000,2024-01-15 19:25:44
TX_022,B3,C2,12000,2024-01-15 19:50:18
TX_023,A1,A2,85000,2024-01-16 09:15:22
TX_024,A2,A5,82000,2024-01-16 09:40:35
TX_025,B1,B2,67000,2024-01-16 10:05:48
TX_026,B2,B4,65000,2024-01-16 10:30:11
TX_027,C1,C2,28000,2024-01-16 11:00:29
TX_028,C2,C3,26000,2024-01-16 11:25:42
TX_029,A3,A5,71000,2024-01-16 12:00:15
TX_030,B3,B4,88000,2024-01-16 12:30:33
TX_031,D1,D2,45000,2024-01-16 13:00:00
TX_032,D2,D3,42000,2024-01-16 13:30:00
TX_033,D3,D4,38000,2024-01-16 14:00:00
TX_034,D4,D5,35000,2024-01-16 14:30:00
TX_035,D5,N8,32000,2024-01-16 15:00:00
TX_036,E1,E2,67000,2024-01-16 15:30:00
TX_037,E2,E3,64000,2024-01-16 16:00:00
TX_038,E3,E4,61000,2024-01-16 16:30:00
TX_039,E4,N9,58000,2024-01-16 17:00:00
TX_040,F1,F2,89000,2024-01-16 17:30:00
TX_041,F2,F3,85000,2024-01-16 18:00:00
TX_042,F3,N10,82000,2024-01-16 18:30:00
TX_043,G1,G2,34000,2024-01-16 19:00:00
TX_044,G2,G3,31000,2024-01-16 19:30:00
TX_045,G3,N11,28000,2024-01-16 20:00:00
TX_046,N4,N12,3500,2024-01-16 20:30:00
TX_047,N5,N13,4200,2024-01-16 21:00:00
TX_048,N6,N14,3800,2024-01-16 21:30:00
TX_049,N7,N15,4500,2024-01-16 22:00:00
TX_050,N8,N16,2900,2024-01-16 22:30:00
TX_051,A1,D1,95000,2024-01-17 09:00:00
TX_052,B1,E1,87000,2024-01-17 09:30:00
TX_053,C1,F1,76000,2024-01-17 10:00:00
TX_054,D1,G1,45000,2024-01-17 10:30:00
TX_055,E1,A2,52000,2024-01-17 11:00:00
TX_056,F1,B2,48000,2024-01-17 11:30:00
TX_057,G1,C2,34000,2024-01-17 12:00:00
TX_058,N9,N17,5600,2024-01-17 12:30:00
TX_059,N10,N18,6200,2024-01-17 13:00:00
TX_060,N11,N19,4800,2024-01-17 13:30:00
TX_061,N12,N20,3200,2024-01-17 14:00:00
TX_062,N13,N21,3900,2024-01-17 14:30:00
TX_063,N14,N22,4100,2024-01-17 15:00:00
TX_064,N15,N23,3700,2024-01-17 15:30:00
TX_065,N16,N24,2800,2024-01-17 16:00:00
TX_066,A2,D2,78000,2024-01-17 16:30:00
TX_067,A3,E2,71000,2024-01-17 17:00:00
TX_068,A4,F2,65000,2024-01-17 17:30:00
TX_069,B2,D3,58000,2024-01-17 18:00:00
TX_070,B3,E3,62000,2024-01-17 18:30:00
TX_071,C2,F3,54000,2024-01-17 19:00:00
TX_072,C3,G2,47000,2024-01-17 19:30:00
TX_073,D2,N25,12000,2024-01-17 20:00:00
TX_074,E2,N26,14000,2024-01-17 20:30:00
TX_075,F2,N27,11000,2024-01-17 21:00:00
TX_076,G2,N28,9000,2024-01-17 21:30:00
TX_077,N17,N29,5100,2024-01-17 22:00:00
TX_078,N18,N30,5800,2024-01-17 22:30:00
TX_079,N19,N31,4600,2024-01-17 23:00:00
TX_080,N20,N32,3400,2024-01-17 23:30:00`;

  return csv;
};

// Define suspicious accounts and fraud rings for demo data
export const getMockSuspiciousData = () => {
  return {
    suspiciousAccounts: [
      'A1', 'A2', 'A3', 'A4', 'A5', 
      'B1', 'B2', 'B3', 'B4', 
      'C1', 'C2', 'C3', 'C4',
      'D1', 'D2', 'D3', 'D4', 'D5',
      'E1', 'E2', 'E3', 'E4',
      'F1', 'F2', 'F3',
      'G1', 'G2', 'G3'
    ],
    fraudRings: [
      {
        id: 'FR-001',
        pattern: 'Money Muling',
        members: ['A1', 'A2', 'A3', 'A4', 'A5'],
        roles: {
          'A1': 'Controller',
          'A2': 'Mule',
          'A3': 'Mule',
          'A4': 'Mule',
          'A5': 'Aggregator'
        }
      },
      {
        id: 'FR-002',
        pattern: 'Layering',
        members: ['B1', 'B2', 'B3', 'B4'],
        roles: {
          'B1': 'Controller',
          'B2': 'Mule',
          'B3': 'Mule',
          'B4': 'Aggregator'
        }
      },
      {
        id: 'FR-003',
        pattern: 'Smurfing',
        members: ['C1', 'C2', 'C3', 'C4'],
        roles: {
          'C1': 'Controller',
          'C2': 'Mule',
          'C3': 'Mule',
          'C4': 'Mule'
        }
      },
      {
        id: 'FR-004',
        pattern: 'Round-Tripping',
        members: ['D1', 'D2', 'D3', 'D4', 'D5'],
        roles: {
          'D1': 'Controller',
          'D2': 'Mule',
          'D3': 'Mule',
          'D4': 'Mule',
          'D5': 'Aggregator'
        }
      },
      {
        id: 'FR-005',
        pattern: 'Shell Company',
        members: ['E1', 'E2', 'E3', 'E4'],
        roles: {
          'E1': 'Controller',
          'E2': 'Mule',
          'E3': 'Mule',
          'E4': 'Aggregator'
        }
      },
      {
        id: 'FR-006',
        pattern: 'Trade-Based Laundering',
        members: ['F1', 'F2', 'F3'],
        roles: {
          'F1': 'Controller',
          'F2': 'Mule',
          'F3': 'Aggregator'
        }
      },
      {
        id: 'FR-007',
        pattern: 'Structuring',
        members: ['G1', 'G2', 'G3'],
        roles: {
          'G1': 'Controller',
          'G2': 'Mule',
          'G3': 'Mule'
        }
      }
    ]
  };
};
