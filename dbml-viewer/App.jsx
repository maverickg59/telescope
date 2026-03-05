import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TableNode from './TableNode';
import CustomEdge from './CustomEdge';
import { transformSchema } from './transform';
import Toolbar from './Toolbar';

const nodeTypes = { table: TableNode };
const edgeTypes = { custom: CustomEdge };

const selectStyle = {
  background: '#2a2a4a',
  color: '#e0e0e0',
  border: '1px solid #3a3a5a',
  borderRadius: 4,
  padding: '0.4rem 0.6rem',
  fontSize: '0.9rem',
  cursor: 'pointer',
  width: 200,
};

const labelStyle = {
  fontSize: '0.8rem',
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [diagrams, setDiagrams] = useState([]);
  const [project, setProject] = useState('');
  const [diagram, setDiagram] = useState('');

  const [locked, setLocked] = useState(false);
  const { zoomIn, zoomOut, fitView: fit } = useReactFlow();
  const projects = [...new Set(diagrams.map(d => d.project))];
  const diagramsForProject = diagrams.filter(d => d.project === project);

  useEffect(() => {
    const handler = (e) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        fit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [zoomIn, zoomOut, fit]);

  useEffect(() => {
    fetch('/api/dbml/diagrams')
      .then(r => r.json())
      .then(data => {
        setDiagrams(data);
        if (data.length > 0) {
          setProject(data[0].project);
          setDiagram(data[0].name);
        }
      });
  }, []);

  const loadDiagram = useCallback(async (proj, name) => {
    if (!proj || !name) return;
    const res = await fetch(`/api/dbml/diagram/${proj}/${name}`);
    if (!res.ok) return;
    const schema = await res.json();
    if (schema.error) return;
    const { nodes: n, edges: e } = transformSchema(schema);
    setNodes(n);
    setEdges(e);
    requestAnimationFrame(() => fit({ padding: 0.1 }));
  }, [setNodes, setEdges, fit]);

  useEffect(() => {
    if (project && diagram) loadDiagram(project, diagram);
  }, [project, diagram, loadDiagram]);

  useEffect(() => {
    const sse = new EventSource('/api/reload');
    sse.onmessage = () => loadDiagram(project, diagram);
    return () => sse.close();
  }, [project, diagram, loadDiagram]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.75rem 1.25rem', background: '#1a1a2e',
        borderBottom: '1px solid #2a2a4a',
      }}>
        <a href="/" style={{
          fontSize: '0.95rem', fontWeight: 600, color: '#e0e0e0',
          textDecoration: 'none', letterSpacing: '0.02em',
        }}>
          🔭 Telescope
        </a>
        <div style={{
          display: 'flex', marginLeft: '1rem',
          border: '1px solid #2a2a4a', borderRadius: 6, overflow: 'hidden',
        }}>
          <a href="/mermaid" style={{
            fontSize: '0.8rem', color: '#666', textDecoration: 'none', padding: '0.3rem 0.75rem',
          }}>Mermaid</a>
          <a href="/dbml" style={{
            fontSize: '0.8rem', color: '#e0e0e0', textDecoration: 'none',
            padding: '0.3rem 0.75rem', background: '#2a2a4a',
          }}>DBML</a>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={labelStyle}>Project</label>
          <select
            value={project}
            onChange={e => {
              const p = e.target.value;
              setProject(p);
              const d = diagrams.find(d => d.project === p);
              if (d) setDiagram(d.name);
            }}
            style={selectStyle}
          >
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label style={labelStyle}>Diagram</label>
          <select value={diagram} onChange={e => setDiagram(e.target.value)} style={selectStyle}>
            {diagramsForProject.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </nav>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          style={{ background: '#0f0f1a' }}
          defaultEdgeOptions={{ type: 'custom' }}
          nodesDraggable={!locked}
          nodesConnectable={!locked}
          panOnDrag={!locked}
          zoomOnScroll={!locked}
          zoomOnPinch={!locked}
          zoomOnDoubleClick={!locked}
        >
          <Toolbar onLockChange={setLocked} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2a4a" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
