const steps = [
  { sequence: 1, name: 'Camera calibration & alignment', status: 'completed', duration: '00:09', confidence: '97.2%' },
  { sequence: 2, name: 'Sample & workspace detection', status: 'completed', duration: '00:12', confidence: '93.5%' },
  { sequence: 3, name: 'Task initiation & hand tracking', status: 'completed', duration: '00:18', confidence: '91.0%' },
  { sequence: 4, name: 'Tool transfer protocol', status: 'in_progress', duration: '00:08', confidence: '84.4%' },
  { sequence: 5, name: 'Verification & specimen sealing', status: 'pending', duration: '—', confidence: '—' },
];

export function ExperimentTimelinePage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">Experiment Step Pipeline</h3>
        </div>
        <span className="card-subtitle">Sequence EXP-2417</span>
      </div>
      <div className="card-body">
        {/* Step Indicator Visualizer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '10px 0' }}>
          {steps.map((st, i) => (
            <div key={st.sequence} style={{ display: 'flex', alignItems: 'center', flex: i === steps.length - 1 ? 'none' : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      st.status === 'completed'
                        ? 'var(--green-bg)'
                        : st.status === 'in_progress'
                        ? 'var(--primary-light)'
                        : 'var(--bg-canvas)',
                    color:
                      st.status === 'completed'
                        ? 'var(--green-text)'
                        : st.status === 'in_progress'
                        ? 'var(--primary)'
                        : 'var(--muted)',
                    border: `2px solid ${
                      st.status === 'completed'
                        ? 'var(--green)'
                        : st.status === 'in_progress'
                        ? 'var(--primary)'
                        : 'var(--border)'
                    }`,
                  }}
                >
                  {st.status === 'completed' ? '✓' : st.sequence}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 90 }}>
                  Step 0{st.sequence}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    background: st.status === 'completed' ? 'var(--green)' : 'var(--border)',
                    margin: '0 8px',
                    marginBottom: 20,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Step</th>
                <th>Name / Description</th>
                <th>Status</th>
                <th>Duration</th>
                <th>AI Confidence</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.sequence}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>0{step.sequence}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{step.name}</td>
                  <td>
                    <span className={`status-badge status-${step.status}`}>
                      {step.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{step.duration}</td>
                  <td style={{ fontWeight: 600, color: step.confidence !== '—' ? 'var(--text)' : 'var(--muted)' }}>
                    {step.confidence}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-sm">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
