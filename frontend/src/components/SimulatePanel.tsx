import React, { useState, useEffect, useRef } from 'react';
import { SimulationResult, SimulationStep, FrameState, AlgorithmId } from '../engine/types';
import { SimConfig } from './ConfigurePanel';

interface SimulatePanelProps {
  result: SimulationResult;
  config: SimConfig;
  onCompare: () => void;
}

export const SimulatePanel: React.FC<SimulatePanelProps> = ({ result, config, onCompare }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMult, setSpeedMult] = useState(config.speed === 'step' ? 0 : config.speed === 'slow' ? 0.5 : config.speed === 'fast' ? 2 : 1);
  const timelineRef = useRef<HTMLDivElement>(null);

  const step = result.steps[currentStepIdx] || null;
  const isFinished = currentStepIdx === result.steps.length - 1;

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || isFinished || speedMult === 0) return;
    const interval = 1000 / speedMult;
    const timer = setTimeout(() => {
      setCurrentStepIdx(prev => Math.min(prev + 1, result.steps.length - 1));
    }, interval);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, isFinished, speedMult, result.steps.length]);

  // Auto-scroll timeline
  useEffect(() => {
    if (timelineRef.current) {
      const activeEl = timelineRef.current.querySelector('.tape-item.active') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStepIdx]);

  const handlePlayPause = () => {
    if (isFinished) {
      setCurrentStepIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const currentFrames = step ? step.frames : Array.from({ length: config.numFrames }).map((_, i) => ({
    frameId: i, page: null, pid: null, dirty: false, referenced: false, loadedAtStep: 0, lastAccessedAtStep: 0
  }) as FrameState);

  const renderFrame = (frame: FrameState) => {
    const isTarget = step && step.loadedIntoFrame === frame.frameId;
    let highlightClass = '';
    if (isTarget) {
      highlightClass = step.hit ? 'frame-hit' : 'frame-fault';
    }

    return (
      <div key={frame.frameId} className={`frame-card-new ${highlightClass}`}>
        <div className="fc-top">F{frame.frameId}</div>
        <div className="fc-mid mono">{frame.page !== null ? frame.page : '—'}</div>
        <div className="fc-bot">
          {frame.page !== null && config.algorithm === 'fifo' && `In: step ${frame.loadedAtStep}`}
          {frame.page !== null && config.algorithm === 'lru' && `Last: step ${frame.lastAccessedAtStep}`}
          {frame.page !== null && config.algorithm === 'clock' && (
            <span style={{ color: frame.referenced ? '#f59e0b' : 'var(--text-muted)' }}>R: {frame.referenced ? '1' : '0'}</span>
          )}
          {frame.page !== null && config.algorithm === 'optimal' && step?.internalState && `Next: ${step.internalState.nextUse ? (step.internalState.nextUse[frame.page] || '∞') : '∞'}`}
        </div>
      </div>
    );
  };

  return (
    <div className="simulate-panel-fixed">
      {/* TOP TIMELINE TAPE */}
      <div className="sim-top-tape" ref={timelineRef}>
        {result.steps.map((s, i) => {
          const status = i < currentStepIdx ? (s.hit ? 'hit' : 'fault') : i === currentStepIdx ? 'active' : 'pending';
          return (
            <div 
              key={i} 
              className={`tape-item ${status} ${i === currentStepIdx ? 'active' : ''}`}
              onClick={() => { setCurrentStepIdx(i); setIsPlaying(false); }}
              id={`step-${i}`}
            >
              <span className="tape-step">Step {i + 1}</span>
              <span className="tape-page mono">{s.access.page}</span>
            </div>
          );
        })}
      </div>

      <div className="sim-main-area">
        {/* CENTER STAGE */}
        <div className="sim-stage">
          <div className="playback-bar">
            <div className="play-btns">
              <button onClick={() => setCurrentStepIdx(Math.max(0, currentStepIdx - 1))} disabled={currentStepIdx === 0}>← Prev</button>
              <button onClick={handlePlayPause}>{isPlaying ? '⏸ Pause' : isFinished ? '↺ Restart' : '▶ Play'}</button>
              <button onClick={() => setCurrentStepIdx(Math.min(result.steps.length - 1, currentStepIdx + 1))} disabled={isFinished}>Next →</button>
              <button onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}>Reset</button>
            </div>
            <div className="step-counter mono">
              Step {currentStepIdx === 0 && !step ? 0 : currentStepIdx + 1} / {result.steps.length}
            </div>
            <div className="speed-toggles">
              {[0.5, 1, 2, 4].map(s => (
                <button key={s} className={speedMult === s ? 'active' : ''} onClick={() => setSpeedMult(s)}>{s}×</button>
              ))}
            </div>
          </div>

          <div className="frames-stage">
            {config.algorithm === 'clock' && (
              <div className="clock-svg-container">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {/* Arc */}
                  <path d="M 20 70 A 50 50 0 1 1 120 70" fill="none" stroke="var(--border-color)" strokeWidth="4" />
                  {/* Ticks */}
                  {Array.from({ length: config.numFrames }).map((_, i) => {
                    const angle = (i / config.numFrames) * Math.PI * 2 - Math.PI / 2;
                    const x = 70 + 60 * Math.cos(angle);
                    const y = 70 + 60 * Math.sin(angle);
                    const tx = 70 + 75 * Math.cos(angle);
                    const ty = 70 + 75 * Math.sin(angle);
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" fill="var(--text-muted)" />
                        <text x={tx} y={ty + 4} fontSize="10" fill="var(--text-muted)" textAnchor="middle">F{i}</text>
                      </g>
                    );
                  })}
                  {/* Hand */}
                  <g style={{ transform: `rotate(${(step?.internalState?.hand || 0) * (360 / config.numFrames)}deg)`, transformOrigin: '70px 70px', transition: 'transform 0.3s ease' }}>
                    <line x1="70" y1="70" x2="70" y2="30" stroke="var(--color-fault)" strokeWidth="3" />
                    <polygon points="66,35 70,25 74,35" fill="var(--color-fault)" />
                  </g>
                </svg>
              </div>
            )}

            <div className="frames-row">
              {currentFrames.map(renderFrame)}
            </div>

            {config.algorithm === 'lru' && step?.internalState?.lruOrder && (
              <div className="algo-indicator">
                <span className="ind-label">LRU ORDER</span>
                <div className="ind-track">
                  {step.internalState.lruOrder.map((fId: number, i: number, arr: number[]) => (
                    <div key={fId} className="ind-pill" style={{ opacity: 0.3 + (i / arr.length) * 0.7 }}>F{fId}</div>
                  ))}
                </div>
              </div>
            )}

            {config.algorithm === 'fifo' && step?.internalState?.queue && (
              <div className="algo-indicator">
                <span className="ind-label">FIFO QUEUE</span>
                <div className="ind-track">
                  {step.internalState.queue.map((fId: number, i: number) => (
                    <React.Fragment key={fId}>
                      <div className="ind-pill">F{fId}</div>
                      {i < step.internalState.queue.length - 1 && <span className="text-muted">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="scrubber-section">
            <input 
              type="range" 
              className="sim-scrubber"
              min={0} 
              max={result.steps.length - 1} 
              value={currentStepIdx} 
              onChange={(e) => { setCurrentStepIdx(Number(e.target.value)); setIsPlaying(false); }}
            />
          </div>

          {isFinished && (
            <div className="results-strip">
              <div className="rs-stats">
                <span>Final Faults <strong className="mono">{result.totalFaults}</strong></span>
                <span>Final Hits <strong className="mono">{result.totalHits}</strong></span>
                <span>Ratio <strong className="mono">{(result.hitRatio*100).toFixed(1)}%</strong></span>
              </div>
              <button className="btn-primary" onClick={onCompare}>Compare All →</button>
            </div>
          )}
        </div>

        {/* DETAILS COLUMN */}
        <div className="sim-details">
          <div className="stats-2x2">
            <div className="s-card">
              <div className="s-lbl">FAULTS</div>
              <div className="s-val mono" style={{ color: 'var(--color-fault)' }}>{step?.cumulativeStats.faults || 0}</div>
            </div>
            <div className="s-card">
              <div className="s-lbl">HITS</div>
              <div className="s-val mono" style={{ color: 'var(--color-hit)' }}>{step?.cumulativeStats.hits || 0}</div>
            </div>
            <div className="s-card">
              <div className="s-lbl">RATIO</div>
              <div className="s-val mono">{((step?.cumulativeStats.hitRatio || 0) * 100).toFixed(1)}%</div>
            </div>
            <div className="s-card">
              <div className="s-lbl">EVICTED</div>
              <div className="s-val mono" style={{ color: 'var(--color-eviction)' }}>{step?.cumulativeStats.evictions || 0}</div>
            </div>
          </div>

          <div className="what-happened" key={`wh-${currentStepIdx}`}>
            <div className="col-header" style={{ marginBottom: '0.5rem', border: 'none' }}>WHAT HAPPENED</div>
            <div className="wh-text">{step ? step.explanation : 'Simulation ready.'}</div>
          </div>

          <div className="pt-section">
            <div className="col-header">PAGE TABLE</div>
            <div className="pt-wrapper">
              <table className="pt-table mono">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Frame</th>
                    <th>V</th>
                    <th>D</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(result.steps.map(s => s.access.page))).sort((a,b) => a-b).map(page => {
                    const frame = currentFrames.find(f => f.page === page);
                    const isCurrent = step?.access.page === page;
                    return (
                      <tr key={page} className={isCurrent ? 'active-row' : ''}>
                        <td>{page}</td>
                        <td>{frame ? frame.frameId : '—'}</td>
                        <td style={{ color: frame ? 'var(--color-hit)' : 'var(--text-muted)' }}>{frame ? '1' : '0'}</td>
                        <td style={{ color: frame?.dirty ? 'var(--color-eviction)' : 'var(--text-muted)' }}>{frame?.dirty ? '1' : '0'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
