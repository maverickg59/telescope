import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const HEADER_H = 40;
export const ROW_H = 28;
export const PAD = 6;

export default function TableNode({ data }) {
  const { table, columnHandles } = data;
  const fields = table.fields || [];

  return (
    <div style={{
      background: '#1e1e2e',
      borderRadius: 8,
      border: '2px solid #313244',
      minWidth: 200,
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        height: HEADER_H,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        background: '#45475a',
        borderRadius: '6px 6px 0 0',
        fontWeight: 600,
        fontSize: 14,
        color: '#cdd6f4',
      }}>
        {table.name}
      </div>
      <div style={{ padding: `${PAD}px 0` }}>
        {fields.map((col, i) => {
          const handles = columnHandles[col.name];
          const handleY = HEADER_H + PAD + i * ROW_H + ROW_H / 2;

          return (
            <div key={col.name} style={{
              height: ROW_H,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: 12,
              borderTop: i > 0 ? '1px solid #313244' : 'none',
              background: handles ? 'rgba(137, 180, 250, 0.05)' : 'transparent',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 16, textAlign: 'center', fontSize: 10, color: '#f9e2af' }}>
                  {col.pk ? '🔑' : col.unique ? '◆' : ''}
                </span>
                <span style={{ color: '#cdd6f4', fontWeight: col.pk ? 600 : 400 }}>
                  {col.name}
                </span>
              </div>
              <span style={{ color: '#6c7086', fontFamily: 'monospace', fontSize: 11, marginLeft: 16 }}>
                {col.type}
              </span>

              {handles?.isTarget && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${col.name}-target`}
                  style={{
                    top: handleY, background: '#89b4fa',
                    width: 8, height: 8, border: '2px solid #1e1e2e', borderRadius: '50%',
                  }}
                />
              )}
              {handles?.isSource && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${col.name}-source`}
                  style={{
                    top: handleY, background: '#89b4fa',
                    width: 8, height: 8, border: '2px solid #1e1e2e', borderRadius: '50%',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
