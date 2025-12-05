import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Graphs.css';

interface TimelineEvent {
  step: number;
  hit: boolean;
  time_ms: number;
  [key: string]: any;
}

interface Props {
  timeline: TimelineEvent[];
  currentStep: number;
}

const Graphs: React.FC<Props> = ({ timeline, currentStep }) => {
  // Calculate cumulative page faults and hits
  const data = timeline.slice(0, currentStep + 1).map((event, index) => {
    const faults = timeline.slice(0, index + 1).filter(e => !e.hit).length;
    const hits = timeline.slice(0, index + 1).filter(e => e.hit).length;
    const hitRatio = hits / (index + 1);

    return {
      step: index + 1,
      faults,
      hits,
      hitRatio: hitRatio * 100,
      time: event.time_ms
    };
  });

  return (
    <div className="graphs">
      <div className="graph-container">
        <h3>Page Faults Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" label={{ value: 'Step', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="faults" stroke="#f44336" strokeWidth={2} name="Page Faults" />
            <Line type="monotone" dataKey="hits" stroke="#4caf50" strokeWidth={2} name="Hits" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="graph-container">
        <h3>Hit Ratio Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" label={{ value: 'Step', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Hit Ratio (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="hitRatio" stroke="#2196f3" strokeWidth={2} name="Hit Ratio %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{data[data.length - 1]?.faults || 0}</div>
          <div className="stat-label">Total Page Faults</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data[data.length - 1]?.hits || 0}</div>
          <div className="stat-label">Total Hits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{(data[data.length - 1]?.hitRatio || 0).toFixed(1)}%</div>
          <div className="stat-label">Hit Ratio</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{(data[data.length - 1]?.time || 0).toFixed(2)} ms</div>
          <div className="stat-label">Total Time</div>
        </div>
      </div>
    </div>
  );
};

export default Graphs;
