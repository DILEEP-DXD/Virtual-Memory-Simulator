import React from 'react';
import './ReportPanel.css';

interface SimulationResult {
  timeline: any[];
  metrics: any;
  config: any;
}

interface Props {
  result: SimulationResult;
}

const ReportPanel: React.FC<Props> = ({ result }) => {
  const { metrics, config } = result;

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const headers = ['step', 'pid', 'page', 'write', 'hit', 'action', 'time_ms'];
    const rows = result.timeline.map(event => [
      event.step,
      event.access.pid,
      event.access.page,
      event.access.write,
      event.hit,
      event.action.replace(/,/g, ';'), // Escape commas
      event.time_ms
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simulation_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTML = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Simulation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 10px 15px; background: #e8f5e9; border-radius: 4px; }
        .metric-label { font-weight: bold; color: #2e7d32; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Virtual Memory Simulation Report</h1>
        <p><em>Generated on ${new Date().toLocaleString()}</em></p>
        
        <h2>Configuration</h2>
        <div class="metric">
            <span class="metric-label">Algorithm:</span> ${config.algorithm}
        </div>
        <div class="metric">
            <span class="metric-label">Frames:</span> ${config.num_frames}
        </div>
        <div class="metric">
            <span class="metric-label">Page Size:</span> ${config.page_size} bytes
        </div>
        
        <h2>Performance Metrics</h2>
        <div class="metric">
            <span class="metric-label">Total Accesses:</span> ${metrics.total_accesses}
        </div>
        <div class="metric">
            <span class="metric-label">Page Faults:</span> ${metrics.page_faults}
        </div>
        <div class="metric">
            <span class="metric-label">Hits:</span> ${metrics.hits}
        </div>
        <div class="metric">
            <span class="metric-label">Hit Ratio:</span> ${(metrics.hit_ratio * 100).toFixed(2)}%
        </div>
        <div class="metric">
            <span class="metric-label">Page-ins:</span> ${metrics.page_ins}
        </div>
        <div class="metric">
            <span class="metric-label">Page-outs:</span> ${metrics.page_outs}
        </div>
        <div class="metric">
            <span class="metric-label">Avg Access Time:</span> ${metrics.avg_access_time_ms.toFixed(4)} ms
        </div>
        
        <h2>Analysis</h2>
        <p>
            The simulation ran ${metrics.total_accesses} memory accesses using the <strong>${config.algorithm}</strong> 
            algorithm with ${config.num_frames} physical frames. The system experienced ${metrics.page_faults} page faults, 
            achieving a hit ratio of ${(metrics.hit_ratio * 100).toFixed(2)}%. 
        </p>
        <p>
            With ${metrics.page_outs} page-outs (dirty pages written back), the average access time was 
            ${metrics.avg_access_time_ms.toFixed(4)} ms, accounting for both memory access latency and swap operations.
        </p>
    </div>
</body>
</html>
`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-panel">
      <div className="summary">
        <h3>Simulation Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <strong>Algorithm:</strong> {config.algorithm}
          </div>
          <div className="summary-item">
            <strong>Frames:</strong> {config.num_frames}
          </div>
          <div className="summary-item">
            <strong>Total Accesses:</strong> {metrics.total_accesses}
          </div>
          <div className="summary-item">
            <strong>Page Faults:</strong> {metrics.page_faults} ({((metrics.page_faults / metrics.total_accesses) * 100).toFixed(1)}%)
          </div>
          <div className="summary-item">
            <strong>Hit Ratio:</strong> {(metrics.hit_ratio * 100).toFixed(2)}%
          </div>
          <div className="summary-item">
            <strong>Avg Access Time:</strong> {metrics.avg_access_time_ms.toFixed(4)} ms
          </div>
        </div>
      </div>

      <div className="export-buttons">
        <button onClick={handleDownloadJSON} className="export-btn">
          📄 Download JSON
        </button>
        <button onClick={handleDownloadCSV} className="export-btn">
          📊 Download CSV
        </button>
        <button onClick={handleDownloadHTML} className="export-btn">
          📝 Download Report (HTML)
        </button>
      </div>
    </div>
  );
};

export default ReportPanel;
