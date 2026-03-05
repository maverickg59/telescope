import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';

const btnStyle = {
  background: 'none',
  border: 'none',
  color: '#e0e0e0',
  width: 32,
  height: 32,
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid #2a2a4a',
};

const lastBtnStyle = { ...btnStyle, borderBottom: 'none' };

export default function Toolbar({ onLockChange }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [locked, setLocked] = useState(false);

  const toggle = () => {
    const next = !locked;
    setLocked(next);
    onLockChange(next);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '1rem',
      left: '1rem',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a2e',
      border: '1px solid #2a2a4a',
      borderRadius: 6,
      overflow: 'hidden',
      zIndex: 10,
    }}>
      <button style={btnStyle} title="Zoom in" onClick={() => zoomIn()}>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <button style={btnStyle} title="Zoom out" onClick={() => zoomOut()}>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      <button style={btnStyle} title="Fit view" onClick={() => fitView({ padding: 0.1 })}>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 4V1h3M10 1h3v3M13 10v3h-3M4 13H1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
      </button>
      <button style={lastBtnStyle} title="Lock interactions" onClick={toggle}>
        {locked ? (
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><circle cx="7" cy="9.5" r="1" fill="currentColor"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
        )}
      </button>
    </div>
  );
}
