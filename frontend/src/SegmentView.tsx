import React from 'react';
import './SegmentView.css';

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

const SegmentView: React.FC<Props> = ({ frames }) => {
  // Group frames by process to show segmentation
  const segments: Record<number, Frame[]> = {};
  const freeFrames: Frame[] = [];

  frames.forEach(frame => {
    if (frame.pid !== null) {
      if (!segments[frame.pid]) {
        segments[frame.pid] = [];
      }
      segments[frame.pid].push(frame);
    } else {
      freeFrames.push(frame);
    }
  });

  const processIds = Object.keys(segments).map(Number).sort();
  
  // Calculate fragmentation
  const totalFrames = frames.length;
  const usedFrames = totalFrames - freeFrames.length;
  const fragmentation = freeFrames.length > 0 ? (freeFrames.length / totalFrames * 100).toFixed(1) : '0.0';

  return (
    <div className="segment-view">
      <div className="segment-stats">
        <div className="stat-item">
          <span className="stat-label">Total Frames:</span>
          <span className="stat-value">{totalFrames}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Used:</span>
          <span className="stat-value">{usedFrames}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Free:</span>
          <span className="stat-value">{freeFrames.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Fragmentation:</span>
          <span className="stat-value">{fragmentation}%</span>
        </div>
      </div>

      <div className="segment-visualization">
        {processIds.map(pid => (
          <div key={pid} className="segment">
            <div className="segment-header">
              Process {pid} ({segments[pid].length} frame{segments[pid].length !== 1 ? 's' : ''})
            </div>
            <div className="segment-frames">
              {segments[pid].map(frame => (
                <div key={frame.frame} className="segment-frame">
                  F{frame.frame}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {freeFrames.length > 0 && (
          <div className="segment free">
            <div className="segment-header">
              Free Frames ({freeFrames.length})
            </div>
            <div className="segment-frames">
              {freeFrames.map(frame => (
                <div key={frame.frame} className="segment-frame">
                  F{frame.frame}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentView;
