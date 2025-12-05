import React from 'react';
import './PageTableView.css';

interface PageTableEntry {
  page: number;
  valid: boolean;
  frame: number | null;
  dirty: boolean;
  referenced: boolean;
}

interface Props {
  pageTables: Record<string, PageTableEntry[]>;
}

const PageTableView: React.FC<Props> = ({ pageTables }) => {
  const processIds = Object.keys(pageTables).sort();

  if (processIds.length === 0) {
    return <div className="page-table-empty">No page tables available</div>;
  }

  return (
    <div className="page-table-view">
      {processIds.map(pid => (
        <div key={pid} className="process-table">
          <h3>Process {pid}</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Valid</th>
                  <th>Frame</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {pageTables[pid]
                  .filter(entry => entry.valid)
                  .map(entry => (
                    <tr key={entry.page} className={entry.valid ? 'valid' : 'invalid'}>
                      <td>{entry.page}</td>
                      <td>
                        <span className={`status ${entry.valid ? 'valid' : 'invalid'}`}>
                          {entry.valid ? '✓' : '✗'}
                        </span>
                      </td>
                      <td>{entry.frame !== null ? entry.frame : '-'}</td>
                      <td>
                        <div className="flags">
                          {entry.dirty && <span className="flag-badge dirty">D</span>}
                          {entry.referenced && <span className="flag-badge referenced">R</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PageTableView;
