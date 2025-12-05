import React, { useState } from 'react';
import SimulatorConfig from './SimulatorConfig';
import MemoryView from './MemoryView';
import PageTableView from './PageTableView';
import SegmentView from './SegmentView';
import TracePlayer from './TracePlayer';
import Graphs from './Graphs';
import ReportPanel from './ReportPanel';
import './App.css';

export interface TimelineEvent {
  step: number;
  access: { pid: number; page: number; write: boolean };
  hit: boolean;
  action: string;
  frames: any[];
  page_tables: Record<string, any[]>;
  time_ms: number;
}

export interface SimulationResult {
  timeline: TimelineEvent[];
  metrics: any;
  config: any;
}

const App: React.FC = () => {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handleSimulationComplete = (simulationResult: SimulationResult) => {
    setResult(simulationResult);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const currentEvent = result?.timeline[currentStep];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Virtual Memory Management Tool</h1>
        <p>Interactive Paging and Segmentation Simulator</p>
      </header>

      <div className="app-container">
        <div className="config-section">
          <SimulatorConfig onSimulationComplete={handleSimulationComplete} />
        </div>

        {result && (
          <>
            <div className="control-section">
              <TracePlayer
                timeline={result.timeline}
                currentStep={currentStep}
                isPlaying={isPlaying}
                onStepChange={setCurrentStep}
                onPlayPause={setIsPlaying}
              />
            </div>

            <div className="visualization-grid">
              <div className="viz-panel">
                <h2>Physical Memory (Frames)</h2>
                <MemoryView frames={currentEvent?.frames || []} />
              </div>

              <div className="viz-panel">
                <h2>Page Tables</h2>
                <PageTableView pageTables={currentEvent?.page_tables || {}} />
              </div>

              <div className="viz-panel">
                <h2>Segmentation View</h2>
                <SegmentView frames={currentEvent?.frames || []} />
              </div>

              <div className="viz-panel full-width">
                <h2>Performance Metrics</h2>
                <Graphs timeline={result.timeline} currentStep={currentStep} />
              </div>

              <div className="viz-panel full-width">
                <h2>Report & Export</h2>
                <ReportPanel result={result} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
