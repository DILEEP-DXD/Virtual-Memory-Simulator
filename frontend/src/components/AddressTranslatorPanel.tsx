import React, { useState, useMemo } from 'react';

const PAGE_SIZES = [
  { label: '256B', value: 256 },
  { label: '512B', value: 512 },
  { label: '1KB', value: 1024 },
  { label: '2KB', value: 2048 },
  { label: '4KB', value: 4096 },
];

export const AddressTranslatorPanel: React.FC = () => {
  const [addrInput, setAddrInput] = useState('1052');
  const [isBinary, setIsBinary] = useState(false);
  const [pageSize, setPageSize] = useState(1024);
  const [numPages, setNumPages] = useState(16); // Determines logical address space

  // Map of Page # -> Frame #
  const [pageTable, setPageTable] = useState<Record<number, number | null>>({
    0: 5,
    1: 2,
    2: null,
    3: 8
  });

  const updatePageTable = (page: number, frameStr: string) => {
    const val = frameStr.trim() === '' ? null : parseInt(frameStr, 10);
    setPageTable(prev => ({ ...prev, [page]: isNaN(val as number) ? null : val }));
  };

  const offsetBits = Math.log2(pageSize);
  const pageBits = Math.log2(numPages);
  const totalBits = offsetBits + pageBits;

  // Compute values
  const logicalAddress = useMemo(() => {
    if (!addrInput) return 0;
    const val = isBinary ? parseInt(addrInput, 2) : parseInt(addrInput, 10);
    return isNaN(val) ? 0 : val;
  }, [addrInput, isBinary]);

  const maxAddress = (numPages * pageSize) - 1;
  const isInvalidAddress = logicalAddress > maxAddress || logicalAddress < 0;

  // Extract page number and offset
  const pageNumber = Math.floor(logicalAddress / pageSize);
  const offset = logicalAddress % pageSize;

  const binaryLogical = logicalAddress.toString(2).padStart(totalBits, '0');
  const binaryPage = binaryLogical.slice(0, Math.max(0, binaryLogical.length - offsetBits)) || '0';
  const binaryOffset = binaryLogical.slice(Math.max(0, binaryLogical.length - offsetBits));

  const frameNumber = pageTable[pageNumber];
  const isFault = frameNumber === undefined || frameNumber === null;
  const physicalAddress = isFault ? null : (frameNumber * pageSize) + offset;

  return (
    <div className="panel translator-panel">
      <h2 className="panel-title">Address Translator</h2>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <label className="form-label">Page Size</label>
            <div className="toggle-group" style={{ flexWrap: 'wrap', marginBottom: '1rem' }}>
              {PAGE_SIZES.map(sz => (
                <button 
                  key={sz.value} 
                  className={`toggle-btn ${pageSize === sz.value ? 'active' : ''}`}
                  onClick={() => setPageSize(sz.value)}
                >
                  {sz.label}
                </button>
              ))}
            </div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
              Offset requires <strong className="mono">{offsetBits}</strong> bits
            </div>
          </div>
          <div>
            <label className="form-label">Number of Pages</label>
            <input 
              type="number" 
              className="input-control" 
              value={numPages} 
              onChange={e => setNumPages(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
            />
            <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Page number requires <strong className="mono">{pageBits}</strong> bits
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Logical Address Input</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button 
                className={`toggle-btn ${!isBinary ? 'active' : ''}`} 
                onClick={() => { setIsBinary(false); setAddrInput(logicalAddress.toString(10)); }}
              >Decimal</button>
              <button 
                className={`toggle-btn ${isBinary ? 'active' : ''}`} 
                onClick={() => { setIsBinary(true); setAddrInput(logicalAddress.toString(2)); }}
              >Binary</button>
            </div>
            <input 
              type="text" 
              className="input-control mono" 
              value={addrInput} 
              onChange={e => setAddrInput(e.target.value)}
              placeholder={isBinary ? "e.g. 1010" : "e.g. 1052"}
              style={{ width: '100%', borderColor: isInvalidAddress ? 'var(--color-fault)' : '' }}
            />
            {isInvalidAddress && (
              <div style={{ color: 'var(--color-fault)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Address out of bounds! Max is {maxAddress}.
              </div>
            )}
          </div>
        </div>

        {!isInvalidAddress && (
          <div style={{ marginTop: '2rem' }}>
            <label className="form-label">Bit Breakdown Diagram</label>
            <div className="bit-diagram" style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '60px' }}>
              <div style={{ flex: pageBits, backgroundColor: 'rgba(108, 99, 255, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px dashed var(--border-color)' }}>
                <span className="mono" style={{ fontSize: '1.25rem', letterSpacing: '2px', color: 'var(--accent)' }}>{binaryPage}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page Number (p) - {pageBits} bits</span>
              </div>
              <div style={{ flex: offsetBits, backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mono" style={{ fontSize: '1.25rem', letterSpacing: '2px', color: 'var(--color-hit)' }}>{binaryOffset}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offset (d) - {offsetBits} bits</span>
              </div>
            </div>
            <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>
              Formula: <strong className="mono" style={{ color: 'var(--text-primary)' }}>Logical Address = (Page# × Page Size) + Offset</strong><br/>
              <span className="mono">{logicalAddress} = ({pageNumber} × {pageSize}) + {offset}</span>
            </div>
          </div>
        )}
      </div>

      {!isInvalidAddress && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Page Table</h3>
            <table className="page-table mono" style={{ width: '100%', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Frame</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.min(numPages, 10) }).map((_, i) => (
                  <tr key={i} style={{ backgroundColor: i === pageNumber ? 'rgba(255,255,255,0.05)' : '' }}>
                    <td>{i}</td>
                    <td style={{ padding: '0' }}>
                      <input 
                        type="text" 
                        value={pageTable[i] === null || pageTable[i] === undefined ? '' : pageTable[i]}
                        onChange={e => updatePageTable(i, e.target.value)}
                        placeholder="null"
                        className="input-control mono"
                        style={{ padding: '0.5rem', width: '100%', height: '100%', backgroundColor: 'transparent', border: '1px solid transparent', borderRadius: 0, fontStyle: pageTable[i] === null || pageTable[i] === undefined ? 'italic' : 'normal', opacity: pageTable[i] === null || pageTable[i] === undefined ? 0.5 : 1 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {numPages > 10 && <div className="text-center text-muted" style={{ padding: '0.5rem' }}>... {numPages - 10} more pages</div>}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Translation Result</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div className="stat-box" style={{ flex: 1 }}>
                <div className="stat-label">Page Number</div>
                <div className="stat-value mono">{pageNumber}</div>
              </div>
              <div className="stat-box" style={{ flex: 1 }}>
                <div className="stat-label">Offset</div>
                <div className="stat-value mono">{offset}</div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '6px', backgroundColor: isFault ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: `1px solid ${isFault ? 'var(--color-fault)' : 'var(--color-hit)'}` }}>
              <div className="stat-label" style={{ color: 'inherit', marginBottom: '0.5rem' }}>Status</div>
              {isFault ? (
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-fault)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono">⚠</span> Page Fault
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Page {pageNumber} is not present in the page table (no valid frame mapped). An interrupt would be generated to fetch it from disk.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-hit)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="mono">✓</span> Hit! Mapped to Frame {frameNumber}
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <div className="text-muted" style={{ marginBottom: '0.25rem' }}>Calculated Physical Address:</div>
                    <div className="mono" style={{ fontSize: '1.5rem' }}>
                      ({frameNumber} × {pageSize}) + {offset} = <strong style={{ color: 'var(--text-primary)' }}>{physicalAddress}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
