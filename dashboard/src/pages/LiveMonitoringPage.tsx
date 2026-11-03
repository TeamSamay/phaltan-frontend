interface LiveMonitoringPageProps {
  event: { payload?: Record<string, unknown>; timestamp?: string; confidence?: number; source?: string };
  status: 'healthy' | 'warning' | 'critical' | 'offline';
}

export function LiveMonitoringPage({ event, status }: LiveMonitoringPageProps) {
  const activityName = String(
    event?.payload?.activity ??
    event?.payload?.action ??
    (event as any)?.type ??
    'hand_object_interaction'
  );
  const confidenceScore = event?.confidence ? (event.confidence * 100).toFixed(1) : '94.0';

  return (
    <div className="grid two-col">
      {/* Video Viewport with HUD overlay */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Live Vision Stream</h3>
          </div>
          <span className={`status-badge status-${status}`}>
            {status === 'healthy' ? 'LIVE' : status}
          </span>
        </div>
        <div className="card-body">
          <div className="video-container">
            {/* HUD Elements */}
            <div className="video-hud-overlay">
              <div className="video-hud-top">
                <div className="video-rec-badge">
                  <span className="video-rec-dot" />
                  FEED 01 • CAM-07
                </div>
                <div className="video-hud-meta">1080P @ 24FPS • 4.2 MBPS</div>
              </div>

              {/* Target Bounding Box Overlay */}
              <div className="video-detected-box">
                <span className="detected-tag">
                  {activityName} [{confidenceScore}%]
                </span>
              </div>

              {/* Central Crosshair */}
              <div className="video-crosshair" />

              <div className="video-hud-bottom">
                <span>AI INFERENCE: NOMINAL</span>
                <span>LATENCY: 92MS</span>
                <span>SYNC: OK</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Optical tracking calibrated. AI inference overlay active.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-sm">
                Snapshot
              </button>
              <button type="button" className="btn btn-sm btn-primary">
                Annotate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition & Telemetry Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h3 className="card-title">Frame Diagnostics</h3>
          </div>
          <span className="card-subtitle">Real-time inference</span>
        </div>
        <div className="card-body">
          <div className="metric-row">
            <span className="metric-label">Detected Action</span>
            <span className="metric-value" style={{ fontSize: 15, color: 'var(--primary)', fontWeight: 600 }}>
              {activityName}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Frame Confidence</span>
            <span className="metric-value" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-text)' }}>
              {confidenceScore}%
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Camera Optical Link</span>
            <span className="metric-value" style={{ fontSize: 14 }}>
              <span className="status-badge status-healthy">Nominal</span>
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Throughput / FPS</span>
            <span className="metric-value" style={{ fontSize: 14 }}>
              24.2 FPS
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Inference Latency</span>
            <span className="metric-value" style={{ fontSize: 14 }}>
              92 ms
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Last Frame Timestamp</span>
            <span className="metric-value" style={{ fontSize: 13, fontFamily: 'monospace' }}>
              {event?.timestamp ?? new Date().toISOString()}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Inference Engine ID</span>
            <span className="metric-value" style={{ fontSize: 13, fontFamily: 'monospace' }}>
              {event?.source ?? 'ai-vision-engine'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
