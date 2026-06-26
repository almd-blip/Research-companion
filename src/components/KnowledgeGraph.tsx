/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Paper, ResearchJourney, GraphNode, GraphLink } from '../types';

interface KnowledgeGraphProps {
  papers: Paper[];
  journeys: ResearchJourney[];
}

export default function KnowledgeGraph({ papers, journeys }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);

  // Generate Graph Nodes and Links from state
  useEffect(() => {
    const tempNodes: GraphNode[] = [];
    const tempLinks: GraphLink[] = [];

    // Add journeys as nodes
    journeys.forEach(j => {
      tempNodes.push({
        id: j.id,
        label: j.title,
        type: 'journey',
        color: '#D97706', // amber-600
      });

      // Links to papers
      j.linkedPaperIds.forEach(pId => {
        tempLinks.push({
          source: j.id,
          target: pId,
          relation: 'references',
        });
      });
    });

    // Add papers as nodes
    papers.forEach(p => {
      tempNodes.push({
        id: p.id,
        label: p.title,
        type: 'paper',
        color: p.verificationStatus === 'verified' ? '#059669' : '#DC2626', // emerald-600 or red-600
      });

      // Add major concepts from papers
      if (p.structuredSummary?.majorConcepts) {
        p.structuredSummary.majorConcepts.forEach(concept => {
          const conceptId = `concept-${concept.toLowerCase().replace(/\s+/g, '-')}`;
          if (!tempNodes.some(n => n.id === conceptId)) {
            tempNodes.push({
              id: conceptId,
              label: concept,
              type: 'concept',
              color: '#2563EB', // blue-600
            });
          }
          tempLinks.push({
            source: p.id,
            target: conceptId,
            relation: 'discusses',
          });
        });
      }

      // Add tags as themes
      p.tags.forEach(tag => {
        const themeId = `theme-${tag.toLowerCase().replace(/\s+/g, '-')}`;
        if (!tempNodes.some(n => n.id === themeId)) {
          tempNodes.push({
            id: themeId,
            label: `#${tag}`,
            type: 'theme',
            color: '#7C3AED', // violet-600
          });
        }
        tempLinks.push({
          source: p.id,
          target: themeId,
          relation: 'tagged',
        });
      });
    });

    setNodes(tempNodes);
    setLinks(tempLinks);
  }, [papers, journeys]);

  // Setup D3 Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 450;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create a group for zoom/pan
    const zoomGroup = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Deep copy of nodes and links to satisfy D3 mutation
    const d3Nodes = nodes.map(d => ({ ...d }));
    const d3Links = links.map(d => ({
      source: d3Nodes.find(n => n.id === (typeof d.source === 'object' ? (d.source as any).id : d.source))!,
      target: d3Nodes.find(n => n.id === (typeof d.target === 'object' ? (d.target as any).id : d.target))!,
      relation: d.relation
    })).filter(l => l.source && l.target);

    // Setup Force simulation
    const simulation = d3.forceSimulation(d3Nodes as any)
      .force('link', d3.forceLink(d3Links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw Links
    const link = zoomGroup.append('g')
      .attr('stroke', '#E2E8F0')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(d3Links)
      .join('line');

    // Draw Nodes
    const node = zoomGroup.append('g')
      .selectAll('.node-group')
      .data(d3Nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        setSelectedNode(d);
      })
      .call(drag(simulation) as any);

    // Node Circles
    node.append('circle')
      .attr('r', (d: any) => d.type === 'journey' ? 12 : d.type === 'paper' ? 9 : 6)
      .attr('fill', (d: any) => d.color || '#94A3B8')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .attr('shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)');

    // Node Labels
    node.append('text')
      .attr('dx', 14)
      .attr('dy', 4)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-sans)')
      .attr('fill', '#475569')
      .text((d: any) => d.label.length > 25 ? d.label.slice(0, 22) + '...' : d.label);

    // Tick function
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag Helper
    function drag(sim: any) {
      function dragstarted(event: any) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) sim.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  // Find linked documents for the selected node
  const getLinkedNodes = (nodeId: string) => {
    return links
      .filter(l => l.source === nodeId || l.target === nodeId)
      .map(l => {
        const otherId = l.source === nodeId ? l.target : l.source;
        return nodes.find(n => n.id === otherId);
      })
      .filter(Boolean) as GraphNode[];
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full" id="knowledge-graph-module">
      <div className="flex-1 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-amber-900/10 dark:border-stone-800 bg-amber-50/40 dark:bg-stone-900/60 flex justify-between items-center">
          <div>
            <h3 className="font-sans font-medium text-stone-900 dark:text-stone-100">Interconnected Knowledge Graph</h3>
            <p className="font-sans text-xs text-stone-500">Drag nodes to explore, scroll to zoom. Visualization of journeys, literature, and concepts.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>Journey</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>Paper</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>Concept</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block"></span>Theme</span>
          </div>
        </div>
        <div ref={containerRef} className="flex-1 bg-white dark:bg-stone-950 relative min-h-[400px]">
          <svg ref={svgRef} className="w-full h-full block" />
        </div>
      </div>

      {/* Selected Node Inspector Sidebar */}
      <div className="w-full lg:w-80 bg-amber-50/20 dark:bg-stone-900/40 border border-amber-900/10 dark:border-stone-800 rounded-lg p-5 flex flex-col justify-between">
        <div>
          <h4 className="font-sans font-medium text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-3">Node Inspector</h4>
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono mb-2 uppercase ${
                  selectedNode.type === 'journey' ? 'bg-amber-100 text-amber-800' :
                  selectedNode.type === 'paper' ? 'bg-emerald-100 text-emerald-800' :
                  selectedNode.type === 'concept' ? 'bg-blue-100 text-blue-800' : 'bg-violet-100 text-violet-800'
                }`}>
                  {selectedNode.type}
                </span>
                <h3 className="font-sans font-semibold text-stone-900 dark:text-stone-100 text-base leading-snug">
                  {selectedNode.label}
                </h3>
              </div>

              {selectedNode.type === 'paper' && (
                <p className="font-sans text-xs text-stone-600 dark:text-stone-400">
                  {papers.find(p => p.id === selectedNode.id)?.authors} ({papers.find(p => p.id === selectedNode.id)?.year})
                </p>
              )}

              <div>
                <h5 className="font-sans font-medium text-[11px] text-stone-400 dark:text-stone-500 uppercase mb-2">Direct Connections</h5>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {getLinkedNodes(selectedNode.id).map(linked => (
                    <button
                      key={linked.id}
                      onClick={() => setSelectedNode(linked)}
                      className="w-full text-left p-2 rounded border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950 hover:bg-amber-50/30 dark:hover:bg-stone-900 font-sans text-xs flex items-center justify-between"
                    >
                      <span className="truncate text-stone-700 dark:text-stone-300 pr-2">{linked.label}</span>
                      <span className="text-[9px] font-mono text-stone-400 dark:text-stone-500 capitalize">{linked.type}</span>
                    </button>
                  ))}
                  {getLinkedNodes(selectedNode.id).length === 0 && (
                    <p className="font-sans text-xs text-stone-400 italic">No connections established yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 dark:text-stone-500 font-sans text-xs">
              <p>Click on any node in the graph to inspect its details and trace academic connections.</p>
            </div>
          )}
        </div>

        {selectedNode && (
          <div className="pt-4 border-t border-amber-900/10 dark:border-stone-800 mt-4 text-center">
            <p className="font-sans text-[10px] text-stone-400">
              Double click on nodes to reposition or zoom to recalibrate perspective.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
