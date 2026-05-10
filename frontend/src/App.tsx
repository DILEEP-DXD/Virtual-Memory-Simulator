import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ConfigurePanel, SimConfig } from './components/ConfigurePanel';
import { SimulatePanel } from './components/SimulatePanel';
import { ComparePanel } from './components/ComparePanel';
import { AddressTranslatorPanel } from './components/AddressTranslatorPanel';
import { runSimulation } from './engine/simulator';
import { SimulationResult } from './engine/types';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('configure');
  
  const [config, setConfig] = useState<SimConfig>({
    algorithm: 'fifo',
    numFrames: 3,
    accesses: [],
    speed: 'normal'
  });

  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleRun = () => {
    if (config.accesses.length > 0) {
      const res = runSimulation(config.algorithm, config.numFrames, config.accesses);
      setResult(res);
      setActiveTab('simulate');
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        algorithm={config.algorithm}
        numFrames={config.numFrames}
      />
      
      <main className="main-content">
        {activeTab === 'configure' && (
          <ConfigurePanel config={config} setConfig={setConfig} onRun={handleRun} />
        )}
        
        {activeTab === 'simulate' && (
          result ? (
            <SimulatePanel 
              result={result} 
              config={config} 
              onCompare={() => setActiveTab('compare')} 
            />
          ) : (
            <div className="panel" style={{ textAlign: 'center', marginTop: '10vh' }}>
              <h2 className="text-muted">No simulation running.</h2>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('configure')}>
                Go to Configure
              </button>
            </div>
          )
        )}
        
        {activeTab === 'compare' && (
          config.accesses.length > 0 ? (
            <ComparePanel config={config} />
          ) : (
            <div className="panel" style={{ textAlign: 'center', marginTop: '10vh' }}>
              <h2 className="text-muted">No configuration found to compare.</h2>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('configure')}>
                Go to Configure
              </button>
            </div>
          )
        )}
        
        {activeTab === 'translator' && (
          <AddressTranslatorPanel />
        )}
      </main>
    </div>
  );
};

export default App;
