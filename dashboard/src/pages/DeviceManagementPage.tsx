import type { DeviceInfo } from '../types';

interface DeviceManagementPageProps {
  devices: DeviceInfo[];
}

export function DeviceManagementPage({ devices }: DeviceManagementPageProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">Device & Subsystem Inventory</h3>
        </div>
        <span className="card-subtitle">{devices.length} registered hardware nodes</span>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>Hardware ID</th>
                <th>Subsystem Type</th>
                <th>Endpoint IP</th>
                <th>Link Status</th>
                <th>Health Diagnostic</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{device.name}</td>
                  <td>
                    <code style={{ background: 'var(--bg-canvas)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      {device.id}
                    </code>
                  </td>
                  <td style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>
                    {device.type}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{device.host}</td>
                  <td>
                    <span className={`status-badge status-${device.status}`}>
                      {device.connectionStatus}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {device.health ?? 'Nominal'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button type="button" className="btn btn-sm">
                        Ping
                      </button>
                      <button type="button" className="btn btn-sm">
                        Logs
                      </button>
                    </div>
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
