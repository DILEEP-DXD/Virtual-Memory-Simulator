import React, { useEffect } from 'react';
import './TracePlayer.css';

interface TimelineEvent {
  step: number;
  [key: string]: any;
}

interface Props {
  timeline: TimelineEvent[];
  currentStep: number;
  isPlaying: boolean;
  onStepChange: (step: number) => void;
  onPlayPause: (playing: boolean) => void;
}

const TracePlayer: React.FC<Props> = ({ 
  timeline, 
  currentStep, 
  isPlaying, 
  onStepChange, 
  onPlayPause 
}) => {
  const maxStep = timeline.length - 1;

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (currentStep < maxStep) {
        onStepChange(currentStep + 1);
      } else {
        onPlayPause(false); // Stop at end
      }
    }, 1000); // 1 second per step

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, maxStep, onStepChange, onPlayPause]);

  const handlePlayPause = () => {
    onPlayPause(!isPlaying);
  };

  const handleStep = (direction: number) => {
    const newStep = Math.max(0, Math.min(maxStep, currentStep + direction));
    onStepChange(newStep);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStepChange(parseInt(e.target.value));
  };

  const handleReset = () => {
    onStepChange(0);
    onPlayPause(false);
  };

  const currentEvent = timeline[currentStep];

  return (
    <div className="trace-player">
      <div className="player-info">
        <div className="step-info">
          <strong>Step:</strong> {currentStep + 1} / {timeline.length}
        </div>
        {currentEvent && (
          <div className="event-info">
            <span className={`event-type ${currentEvent.hit ? 'hit' : 'fault'}`}>
              {currentEvent.hit ? '✓ HIT' : '✗ FAULT'}
            </span>
            <span className="event-details">
              Process {currentEvent.access.pid} → Page {currentEvent.access.page}
              {currentEvent.access.write && ' (WRITE)'}
            </span>
            <span className="event-action">{currentEvent.action}</span>
          </div>
        )}
      </div>

      <div className="player-controls">
        <button 
          onClick={handleReset}
          className="control-btn"
          title="Reset to start"
        >
          ⏮
        </button>
        <button 
          onClick={() => handleStep(-1)}
          disabled={currentStep === 0}
          className="control-btn"
          title="Previous step"
        >
          ⏪
        </button>
        <button 
          onClick={handlePlayPause}
          className="control-btn play-pause"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button 
          onClick={() => handleStep(1)}
          disabled={currentStep === maxStep}
          className="control-btn"
          title="Next step"
        >
          ⏩
        </button>
        <button 
          onClick={() => onStepChange(maxStep)}
          className="control-btn"
          title="Jump to end"
        >
          ⏭
        </button>
      </div>

      <div className="timeline-scrubber">
        <input 
          type="range" 
          min="0" 
          max={maxStep}
          value={currentStep}
          onChange={handleSliderChange}
          className="timeline-slider"
        />
      </div>
    </div>
  );
};

export default TracePlayer;
