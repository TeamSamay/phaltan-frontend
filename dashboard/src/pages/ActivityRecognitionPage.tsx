import type { LogEvent } from '../types';

interface ActivityRecognitionPageProps {
  event: LogEvent;
}

export function ActivityRecognitionPage({ event }: ActivityRecognitionPageProps) {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  const rawObjects = payload.objects;
  const objects = Array.isArray(rawObjects) ? (rawObjects as string[]) : ['cup', 'hand', 'pipette'];
  const confidencePct = event.confidence ? (event.confidence * 100).toFixed(1) : '94.0';

  return (
    <div className="grid two-col">
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Activity Recognition Core</h3>
          </div>
          <span className="status-badge status-healthy">Model v2.4</span>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>
              Detected Spatial Objects
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {objects.map((obj, i) => (
                <span
                  key={i}
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    border: '1px solid var(--primary-border)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {obj}
                </span>
              ))}
            </div>
          </div>

          <div className="metric-row">
            <span className="metric-label">Current Action Class</span>
            <span className="metric-value" style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
              {String(payload.activity ?? payload.action ?? event.type ?? 'STEP_STARTED')}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Model Confidence</span>
            <span className="metric-value" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-text)' }}>
              {confidencePct}%
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Temporal Context</span>
            <span className="metric-value" style={{ fontSize: 14 }}>
              Multi-frame sliding window (16 frames)
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Inference Status</span>
            <span className="metric-value">
              <span className={`status-badge status-${event.status}`}>{event.status}</span>
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Review Flag</span>
            <span className="metric-value" style={{ fontSize: 14 }}>
              {event.status === 'needs_review' ? (
                <span style={{ color: 'var(--amber-text)', fontWeight: 600 }}>Review Required</span>
              ) : (
                <span style={{ color: 'var(--green-text)', fontWeight: 600 }}>Automated Verification OK</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Prediction Distribution</h3>
          </div>
          <span className="card-subtitle">Top Probabilities</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>hand_object_interaction</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>94.0%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '94%' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>tool_transfer</span>
                <span style={{ fontWeight: 700, color: 'var(--muted)' }}>4.8%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '4.8%', background: 'var(--muted-light)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>specimen_placement</span>
                <span style={{ fontWeight: 700, color: 'var(--muted)' }}>1.2%</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '1.2%', background: 'var(--muted-light)' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-panel-alt)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Confidence margin &gt; 80% enables automated state transition without operator review.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
