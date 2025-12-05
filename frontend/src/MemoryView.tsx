import React from 'react';
import './MemoryView.css';

interface Frame {
  frame: number;
  pid: number | null;
  page: number | null;
  dirty: boolean;
  referenced: boolean;
}

interface Props {
  frames: Frame[];
}

const MemoryView: React.FC<Props> = ({ frames }) => {
  return (
    <div className="memory-view">
      <div className="frames-grid">
        {frames.map((frame) => (
          <div 
            key={frame.frame}
            className={`frame-box ${frame.pid !== null ? 'occupied' : 'empty'} ${frame.referenced ? 'referenced' : ''}`}
          >
            <div className="frame-number">Frame {frame.frame}</div>
            {frame.pid !== null ? (
              <div className="frame-content">
                <div className="frame-info">
                  <strong>P{frame.pid}</strong> : Page {frame.page}
                </div>
                <div className="frame-flags">
                  {frame.dirty && <span className="flag dirty">D</span>}
                  {frame.referenced && <span className="flag referenced">R</span>}
                </div>
              </div>
            ) : (
              <div className="frame-empty-label">Free</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="legend">
        <div className="legend-item">
          <span className="flag dirty">D</span> = Dirty (Modified)
        </div>
        <div className="legend-item">
          <span className="flag referenced">R</span> = Referenced
        </div>
      </div>
    </div>
  );
};

export default MemoryView;
