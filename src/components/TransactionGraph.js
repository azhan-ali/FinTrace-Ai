import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const TransactionGraph = ({ darkMode, onNodeClick, highlightedRing, graphData, heatmapMode, viewMode, kingpinHighlighted, replayState }) => {
  const graphRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [nodeScale, setNodeScale] = useState(1.5); // 0.5 to 2
  const [linkDistance, setLinkDistance] = useState(50); // 10 to 100
  const [chargeStrength, setChargeStrength] = useState(-40); // -200 to -20
  const [showControls, setShowControls] = useState(false); // Toggle controls visibility

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: 500
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Reapply force simulation when sliders change
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('link').distance(linkDistance);
      graphRef.current.d3Force('charge').strength(chargeStrength);
    }
  }, [linkDistance, chargeStrength]);

  // Track mouse position for tooltip
  useEffect(() => {
    const handleMouseMove = (e) => {
      const container = document.getElementById('graph-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const container = document.getElementById('graph-container');
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
    return undefined;
  }, []);

  // Zoom to fit selected ring when highlightedRing changes
  useEffect(() => {
    if (highlightedRing && highlightedRing.memberAccounts && graphRef.current && graphData) {
      // Find nodes that are part of the selected ring
      const ringNodes = graphData.nodes.filter(node => 
        highlightedRing.memberAccounts.includes(node.id)
      );

      if (ringNodes.length > 0) {
        // Calculate bounding box of ring nodes
        const xs = ringNodes.map(n => n.x).filter(x => x !== undefined);
        const ys = ringNodes.map(n => n.y).filter(y => y !== undefined);

        if (xs.length > 0 && ys.length > 0) {
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;

          // Add padding
          const padding = 100;
          const width = maxX - minX + padding * 2;
          const height = maxY - minY + padding * 2;

          // Calculate zoom level to fit the ring
          const zoomLevel = Math.min(
            dimensions.width / width,
            dimensions.height / height,
            3 // Max zoom level
          );

          // Smooth zoom and center
          setTimeout(() => {
            if (graphRef.current) {
              graphRef.current.centerAt(centerX, centerY, 1000);
              graphRef.current.zoom(zoomLevel, 1000);
            }
          }, 100);
        }
      }
    }
  }, [highlightedRing, graphData, dimensions]);

  // Zoom to kingpin when kingpinHighlighted changes
  useEffect(() => {
    if (kingpinHighlighted && graphRef.current && graphData) {
      const kingpinNode = graphData.nodes.find(node => node.isKingpin);
      
      if (kingpinNode && kingpinNode.x !== undefined && kingpinNode.y !== undefined) {
        // Smooth zoom and center on kingpin
        setTimeout(() => {
          if (graphRef.current) {
            graphRef.current.centerAt(kingpinNode.x, kingpinNode.y, 1000);
            graphRef.current.zoom(2.5, 1000); // Zoom in on kingpin
          }
        }, 100);
      }
    }
  }, [kingpinHighlighted, graphData]);

  // Handle node click
  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  // Handle node hover
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  // Helper function to get node color based on heatmap mode
  const getNodeColor = useCallback((node) => {
    // Kingpin always gets gold color
    if (node.isKingpin) {
      return darkMode ? '#fbbf24' : '#f59e0b'; // Gold
    }
    
    if (heatmapMode) {
      // Heatmap mode: color based on risk score
      const score = node.risk || 0;
      if (score >= 60) return darkMode ? '#ff3b3b' : '#dc2626'; // Red
      if (score >= 30) return darkMode ? '#ff9a3b' : '#f97316'; // Orange
      return darkMode ? '#3b82f6' : '#2563eb'; // Blue
    } else {
      // Normal mode: suspicious vs normal
      if (node.suspicious) {
        return darkMode ? '#ef4444' : '#dc2626'; // Red
      } else {
        return darkMode ? '#3b82f6' : '#2563eb'; // Blue
      }
    }
  }, [darkMode, heatmapMode]);

  // Custom node rendering
  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHighlighted = highlightedRing && highlightedRing.memberAccounts && 
                          highlightedRing.memberAccounts.includes(node.id);
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    const isDimmed = (highlightedRing && highlightedRing.memberAccounts && 
                     !highlightedRing.memberAccounts.includes(node.id)) ||
                     (kingpinHighlighted && !node.isKingpin);
    const isKingpinFocused = kingpinHighlighted && node.isKingpin;
    
    // Check if this node is connected to hovered node
    const isConnectedToHovered = hoveredNode && graphData && graphData.links && 
      graphData.links.some(link => 
        ((link.source.id || link.source) === hoveredNode.id && (link.target.id || link.target) === node.id) ||
        ((link.target.id || link.target) === hoveredNode.id && (link.source.id || link.source) === node.id)
      );
    
    const shouldShowColor = !hoveredNode || isHovered || isConnectedToHovered;
    
    // Node size based on risk and role - INCREASED SIZES
    let size = 6 * nodeScale; // Base size for normal accounts (increased from 4)
    
    // Kingpin gets biggest size
    if (node.isKingpin) {
      size = (isKingpinFocused ? 12 : 10) * nodeScale; // Moderate kingpin size
    } else if (heatmapMode) {
      // In heatmap mode, size based on risk score
      const score = node.risk || 0;
      if (score >= 80) size = 9 * nodeScale;
      else if (score >= 60) size = 8 * nodeScale;
      else if (score >= 40) size = 7 * nodeScale;
      else if (score >= 20) size = 6.5 * nodeScale;
      else size = 6 * nodeScale;
    } else {
      // Normal mode: size based on role
      if (node.role === 'Controller') size = 9 * nodeScale;
      else if (node.role === 'Aggregator') size = 8 * nodeScale;
      else if (node.role === 'Mule') size = 7 * nodeScale;
      else if (node.suspicious) size = 6.5 * nodeScale;
    }
    
    if (isHighlighted) size += 2;
    if (isHovered) size += 1.5;

    // Apply dimming opacity for non-selected nodes
    if (isDimmed) {
      ctx.globalAlpha = 0.1; // More dimming when kingpin focused
    } else if (hoveredNode && !shouldShowColor) {
      ctx.globalAlpha = 0.15; // Dim non-connected nodes when hovering
    }

    // Node color - GRAYSCALE WHEN NOT HOVERED
    let nodeColor;
    if (!shouldShowColor) {
      // Grayscale for non-connected nodes
      nodeColor = darkMode ? '#6b7280' : '#d1d5db';
    } else {
      nodeColor = getNodeColor(node);
    }

    // Draw special glow for kingpin - ENHANCED
    if (node.isKingpin) {
      // Multi-layer gold glow for prominence
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 12, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.fill();
    } else if (isHighlighted) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)'; // Yellow glow
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.fill();
    } else if (node.suspicious || (heatmapMode && node.risk >= 60)) {
      // Draw glow for suspicious nodes (if not dimmed)
      if (!isDimmed) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
        
        if (heatmapMode && node.risk >= 60) {
          ctx.fillStyle = darkMode ? 'rgba(255, 59, 59, 0.3)' : 'rgba(220, 38, 38, 0.3)';
        } else if (node.suspicious) {
          ctx.fillStyle = darkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)';
        }
        ctx.fill();
      }
    }

    // Draw main node
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = nodeColor;
    ctx.fill();

    // Draw border - ENHANCED
    let borderColor;
    let borderWidth;
    if (node.isKingpin) {
      borderColor = '#d97706'; // Darker gold for kingpin
      borderWidth = 3;
    } else if (isHighlighted) {
      borderColor = '#fbbf24'; // Yellow for highlighted
      borderWidth = 2.5;
    } else if (heatmapMode) {
      const score = node.risk || 0;
      if (score >= 60) borderColor = darkMode ? '#fca5a5' : '#991b1b';
      else if (score >= 30) borderColor = darkMode ? '#fdba74' : '#c2410c';
      else borderColor = darkMode ? '#60a5fa' : '#1e40af';
      borderWidth = 1.5;
    } else {
      borderColor = node.suspicious ? (darkMode ? '#fca5a5' : '#991b1b') : (darkMode ? '#60a5fa' : '#1e40af');
      borderWidth = node.suspicious ? 2 : 1.5;
    }
    
    // Apply grayscale to border if not connected
    if (!shouldShowColor) {
      borderColor = darkMode ? '#9ca3af' : '#9ca3af';
    }
    
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    // Draw crown icon for kingpin - ENHANCED DESIGN
    if (node.isKingpin && !isDimmed) {
      const crownSize = size * 0.5; // Smaller crown
      const crownY = node.y - size - crownSize - 6;
      
      ctx.save();
      ctx.translate(node.x, crownY);
      
      // Draw crown shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.moveTo(-crownSize + 1, crownSize * 0.5 + 2);
      ctx.lineTo(-crownSize * 0.6 + 1, -crownSize * 0.3 + 2);
      ctx.lineTo(-crownSize * 0.2 + 1, crownSize * 0.2 + 2);
      ctx.lineTo(1, -crownSize + 2);
      ctx.lineTo(crownSize * 0.2 + 1, crownSize * 0.2 + 2);
      ctx.lineTo(crownSize * 0.6 + 1, -crownSize * 0.3 + 2);
      ctx.lineTo(crownSize + 1, crownSize * 0.5 + 2);
      ctx.lineTo(crownSize + 1, crownSize * 0.8 + 2);
      ctx.lineTo(-crownSize + 1, crownSize * 0.8 + 2);
      ctx.closePath();
      ctx.fill();
      
      // Draw crown gradient
      const gradient = ctx.createLinearGradient(0, -crownSize, 0, crownSize * 0.8);
      gradient.addColorStop(0, '#fde047'); // Lighter gold at top
      gradient.addColorStop(0.5, '#fbbf24'); // Medium gold
      gradient.addColorStop(1, '#f59e0b'); // Darker gold at bottom
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      
      // Crown base with better proportions
      ctx.beginPath();
      ctx.moveTo(-crownSize, crownSize * 0.5);
      ctx.lineTo(-crownSize * 0.6, -crownSize * 0.3);
      ctx.lineTo(-crownSize * 0.2, crownSize * 0.2);
      ctx.lineTo(0, -crownSize);
      ctx.lineTo(crownSize * 0.2, crownSize * 0.2);
      ctx.lineTo(crownSize * 0.6, -crownSize * 0.3);
      ctx.lineTo(crownSize, crownSize * 0.5);
      ctx.lineTo(crownSize, crownSize * 0.8);
      ctx.lineTo(-crownSize, crownSize * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Add jewels on crown tips
      const jewels = [
        { x: -crownSize * 0.6, y: -crownSize * 0.3 },
        { x: 0, y: -crownSize },
        { x: crownSize * 0.6, y: -crownSize * 0.3 }
      ];
      
      jewels.forEach(jewel => {
        // Jewel glow
        ctx.beginPath();
        ctx.arc(jewel.x, jewel.y, crownSize * 0.15, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fill();
        
        // Jewel
        ctx.beginPath();
        ctx.arc(jewel.x, jewel.y, crownSize * 0.12, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444'; // Red jewel
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Jewel highlight
        ctx.beginPath();
        ctx.arc(jewel.x - crownSize * 0.03, jewel.y - crownSize * 0.03, crownSize * 0.04, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      });
      
      ctx.restore();
    }

    // Reset opacity
    ctx.globalAlpha = 1;

    // Draw label for kingpin, highlighted or hovered nodes
    if ((node.isKingpin || isHighlighted || isHovered) && !isDimmed) {
      const label = node.id;
      const fontSize = 12 / globalScale;
      ctx.font = `bold ${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw label background
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        node.x - textWidth / 2 - 4,
        node.y + size + fontSize / 2,
        textWidth + 8,
        fontSize + 4
      );
      
      // Draw label text
      ctx.fillStyle = isHighlighted ? '#fbbf24' : (node.isKingpin ? '#fbbf24' : (darkMode ? '#e5e7eb' : '#1f2937'));
      ctx.fillText(label, node.x, node.y + size + fontSize + 2);
    }
  }, [darkMode, hoveredNode, highlightedRing, heatmapMode, kingpinHighlighted, getNodeColor, graphData, nodeScale]);

  // Helper function to get edge width based on heatmap mode
  const getEdgeWidth = useCallback((link) => {
    if (heatmapMode && link.value) {
      // Heatmap mode: thickness based on transaction amount
      // Scale: $5000 = 1px, max 6px
      return Math.max(0.5, Math.min(6, link.value / 5000));
    } else if (viewMode === 'rings') {
      // Rings mode: slightly thicker edges to emphasize connections
      return 1.5;
    } else {
      // Normal mode: thin lines
      return 0.5;
    }
  }, [heatmapMode, viewMode]);

  // Custom link rendering
  const paintLink = useCallback((link, ctx) => {
    if (!graphData || !graphData.nodes) return;
    
    const sourceNode = graphData.nodes.find(n => n.id === (link.source.id || link.source));
    const targetNode = graphData.nodes.find(n => n.id === (link.target.id || link.target));
    
    const isHighlighted = highlightedRing && highlightedRing.memberAccounts &&
      highlightedRing.memberAccounts.includes(sourceNode?.id) && 
      highlightedRing.memberAccounts.includes(targetNode?.id);

    const isDimmed = (highlightedRing && highlightedRing.memberAccounts &&
      (!highlightedRing.memberAccounts.includes(sourceNode?.id) || 
       !highlightedRing.memberAccounts.includes(targetNode?.id))) ||
      (kingpinHighlighted && !sourceNode?.isKingpin && !targetNode?.isKingpin);

    // Check if this link is connected to hovered node
    const isHoveredLink = hoveredNode && (
      (link.source.id || link.source) === hoveredNode.id ||
      (link.target.id || link.target) === hoveredNode.id
    );

    // Check if this is the active transaction in replay
    const isReplayActive = replayState && replayState.isPlaying && replayState.currentIndex >= 0;
    const linkIndex = graphData.links.indexOf(link);
    const isCurrentReplayLink = isReplayActive && linkIndex === replayState.currentIndex;
    const isPlayedLink = isReplayActive && linkIndex < replayState.currentIndex;

    // Link width based on heatmap mode
    const linkWidth = getEdgeWidth(link);
    
    // Link color - ENHANCED FOR HOVER
    let linkColor;
    if (isCurrentReplayLink) {
      linkColor = '#fbbf24'; // Yellow for current replay transaction
    } else if (isHighlighted) {
      linkColor = '#fbbf24'; // yellow for highlighted
    } else if (isHoveredLink) {
      // Hovered link gets full color
      if (viewMode === 'rings') {
        linkColor = darkMode ? '#f87171' : '#ef4444'; // red for ring connections
      } else if (heatmapMode) {
        const amount = link.value || 0;
        if (amount > 100000) {
          linkColor = darkMode ? '#f87171' : '#ef4444'; // red for high amounts
        } else if (amount > 50000) {
          linkColor = darkMode ? '#fb923c' : '#f97316'; // orange for medium amounts
        } else {
          linkColor = darkMode ? '#60a5fa' : '#3b82f6'; // blue for low amounts
        }
      } else if (sourceNode?.suspicious && targetNode?.suspicious) {
        linkColor = darkMode ? '#f87171' : '#ef4444'; // red for suspicious
      } else {
        linkColor = darkMode ? '#4b5563' : '#9ca3af'; // gray for normal
      }
    } else if (viewMode === 'rings') {
      // In rings mode, emphasize ring connections
      linkColor = darkMode ? '#f87171' : '#ef4444'; // red for ring connections
    } else if (heatmapMode) {
      // In heatmap mode, color based on amount
      const amount = link.value || 0;
      if (amount > 100000) {
        linkColor = darkMode ? '#f87171' : '#ef4444'; // red for high amounts
      } else if (amount > 50000) {
        linkColor = darkMode ? '#fb923c' : '#f97316'; // orange for medium amounts
      } else {
        linkColor = darkMode ? '#60a5fa' : '#3b82f6'; // blue for low amounts
      }
    } else if (sourceNode?.suspicious && targetNode?.suspicious) {
      linkColor = darkMode ? '#f87171' : '#ef4444'; // red for suspicious
    } else {
      linkColor = darkMode ? '#4b5563' : '#9ca3af'; // gray for normal
    }

    // Draw arrow
    const start = link.source;
    const end = link.target;
    
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = isCurrentReplayLink ? linkWidth + 3 : (isHighlighted ? linkWidth + 2 : linkWidth);
    
    // Apply dimming or highlighting opacity
    if (hoveredNode && !isHoveredLink) {
      // Dim non-hovered links when hovering
      ctx.globalAlpha = 0.1;
    } else if (isReplayActive && !isCurrentReplayLink && !isPlayedLink) {
      ctx.globalAlpha = 0.05; // Dim future transactions
    } else if (isReplayActive && isPlayedLink) {
      ctx.globalAlpha = 0.2; // Slightly visible for played transactions
    } else if (isDimmed) {
      ctx.globalAlpha = 0.03; // Very dim when kingpin focused
    } else if (isCurrentReplayLink || isHighlighted) {
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = viewMode === 'rings' ? 0.8 : (heatmapMode ? 0.7 : 0.4);
    }
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Draw arrowhead
    const arrowLength = isCurrentReplayLink ? 10 : (isHighlighted ? 8 : 6);
    const arrowWidth = isCurrentReplayLink ? 6 : (isHighlighted ? 5 : 4);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    ctx.save();
    ctx.translate(end.x, end.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowLength, arrowWidth / 2);
    ctx.lineTo(-arrowLength, -arrowWidth / 2);
    ctx.closePath();
    ctx.fillStyle = linkColor;
    ctx.fill();
    ctx.restore();
    
    // Draw animated flow particle for current replay transaction
    if (isCurrentReplayLink) {
      const progress = 0.5; // Middle of the edge
      const particleX = start.x + (end.x - start.x) * progress;
      const particleY = start.y + (end.y - start.y) * progress;
      
      // Draw glowing particle
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(particleX, particleY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(particleX, particleY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }, [darkMode, highlightedRing, graphData, heatmapMode, viewMode, kingpinHighlighted, replayState, getEdgeWidth, hoveredNode]);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            No transaction data loaded
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload a CSV file to visualize the network
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="graph-container" className="relative w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={darkMode ? '#111827' : '#ffffff'}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        nodeLabel={node => ''}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleSpeed={0.003}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={0}
        numDimensions={2}
        linkDistance={linkDistance}
        d3Force={{
          charge: { strength: chargeStrength }
        }}
      />
      
      {/* Tooltip - Follows Cursor */}
      {hoveredNode && (
        <div 
          className="absolute pointer-events-none z-50"
          style={{
            left: `${mousePos.x + 15}px`,
            top: `${mousePos.y + 15}px`,
            transform: 'none'
          }}
        >
          <div className={`border-2 rounded-xl shadow-2xl p-4 min-w-[200px] ${
            hoveredNode.isKingpin 
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-400 dark:border-yellow-600'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            {hoveredNode.isKingpin && (
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-300 dark:border-yellow-700">
                <span className="text-xl">👑</span>
                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                  Likely Kingpin
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                {hoveredNode.id}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                hoveredNode.risk >= 80 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : hoveredNode.risk >= 50
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                Risk: {hoveredNode.risk}%
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{hoveredNode.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹{hoveredNode.amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {hoveredNode.transactionCount}
                </span>
              </div>
              {hoveredNode.isKingpin && hoveredNode.kingpinData && (
                <>
                  <div className="flex justify-between pt-2 border-t border-yellow-200 dark:border-yellow-800">
                    <span className="text-gray-600 dark:text-gray-400">Total Flow:</span>
                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                      ₹{hoveredNode.kingpinData.total_flow?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Connections:</span>
                    <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                      {hoveredNode.kingpinData.connections}
                    </span>
                  </div>
                </>
              )}
              {hoveredNode.ring && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ring:</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {hoveredNode.ring}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  hoveredNode.suspicious 
                    ? 'text-red-600 dark:text-red-500' 
                    : 'text-green-600 dark:text-green-500'
                }`}>
                  {hoveredNode.suspicious ? '⚠️ Suspicious' : '✓ Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Display */}
      <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs">
        <div className="font-bold text-gray-900 dark:text-white mb-2">
          {viewMode === 'full' && 'Network Stats'}
          {viewMode === 'suspicious' && 'Suspicious Accounts'}
          {viewMode === 'rings' && 'Fraud Ring Members'}
        </div>
        <div className="space-y-1 text-gray-700 dark:text-gray-300">
          <div>⚡ {graphData.links.length} transactions</div>
          <div>📤 {new Set(graphData.links.map(l => l.source.id || l.source)).size} senders</div>
          <div>📥 {new Set(graphData.links.map(l => l.target.id || l.target)).size} receivers</div>
          {viewMode === 'full' && (
            <div className="text-red-600 dark:text-red-500">
              ⚠️ {graphData.nodes.filter(n => n.suspicious).length} suspicious
            </div>
          )}
          {viewMode === 'suspicious' && (
            <div className="text-red-600 dark:text-red-500">
              🔥 High risk only (score &gt; 60)
            </div>
          )}
          {viewMode === 'rings' && (
            <div className="text-red-600 dark:text-red-500">
              🔴 Ring members only
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs">
        <div className="font-bold text-gray-900 dark:text-white mb-2">
          {heatmapMode ? 'Heatmap Legend' : 'Legend'}
        </div>
        {heatmapMode ? (
          <div className="space-y-1">
            <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Node Risk:</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-700 dark:text-gray-300">High Risk (60-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Medium Risk (30-60)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Low Risk (0-30)</span>
            </div>
            <div className="font-semibold text-gray-700 dark:text-gray-300 mt-2 mb-1">Edge Amount:</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-red-400"></div>
              <span className="text-gray-700 dark:text-gray-300">&gt;$100K</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-orange-400"></div>
              <span className="text-gray-700 dark:text-gray-300">$50K-$100K</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-400"></div>
              <span className="text-gray-700 dark:text-gray-300">&lt;$50K</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Suspicious Account</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Normal Account</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-400"></div>
              <span className="text-gray-700 dark:text-gray-300">Suspicious Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-400"></div>
              <span className="text-gray-700 dark:text-gray-300">Normal Flow</span>
            </div>
          </div>
        )}
      </div>

      {/* Settings Icon - Toggle Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setShowControls(!showControls)}
          className="p-3 bg-white/90 dark:bg-gray-800/90 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg transition-colors"
          title="Toggle graph controls"
        >
          <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Dynamic Controls Panel - Collapsible */}
        {showControls && (
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-64 shadow-lg">
            <div className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Graph Controls</div>
            
            {/* Node Size Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Node Size</label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{(nodeScale * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={nodeScale}
                onChange={(e) => setNodeScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>

            {/* Link Distance Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Link Distance</label>
                <span className="text-xs font-bold text-green-600 dark:text-green-400">{linkDistance}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={linkDistance}
                onChange={(e) => setLinkDistance(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Tight</span>
                <span>Spread</span>
              </div>
            </div>

            {/* Charge Repulsion Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Repulsion</label>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{Math.abs(chargeStrength)}</span>
              </div>
              <input
                type="range"
                min="-200"
                max="-20"
                step="10"
                value={chargeStrength}
                onChange={(e) => setChargeStrength(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Weak</span>
                <span>Strong</span>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setNodeScale(1.5);
                setLinkDistance(50);
                setChargeStrength(-40);
              }}
              className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Reset to Default
            </button>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-600 dark:text-gray-400">
        <div>🖱️ Drag to pan • Scroll to zoom • Click node for details</div>
      </div>
    </div>
  );
};

export default TransactionGraph;
