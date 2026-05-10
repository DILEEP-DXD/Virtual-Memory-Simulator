import React from 'react';
import { AlgorithmId } from '../engine/types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  algorithm: AlgorithmId;
  numFrames: number;
}

const TABS = [
  { id: 'configure', label: 'Configure' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'compare', label: 'Compare' },
  { id: 'translator', label: 'Address Translator' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, algorithm, numFrames }) => {
  return (
    <div className="sidebar">
      <h1 className="mono">VM Simulator</h1>
      
      <nav className="nav-links">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="status-badge" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--accent)', padding: '12px', borderRadius: '4px', fontSize: '12px' }}>
        <div style={{ marginBottom: '4px' }}>Algorithm: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{algorithm.toUpperCase()}</strong></div>
        <div>Frames: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{numFrames}</strong></div>
      </div>
    </div>
  );
};
