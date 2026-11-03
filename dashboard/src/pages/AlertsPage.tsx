import { useState } from 'react';
import type { AlertItem } from '../types';

interface AlertsPageProps {
  alerts: AlertItem[];
  onAcknowledge?: (id: string) => void;
}

export function AlertsPage({ alerts, onAcknowledge }: AlertsPageProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filtered = alerts.filter((a) => (filter === 'all' ? true : a.level === filter));

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">Alerts & Operational Deviations</h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'critical', 'warning', 'info'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`chart-pill ${filter === lvl ? 'active' : ''}`}
              onClick={() => setFilter(lvl)}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        {filtered.length === 0 ? (
          <div className="empty-state">No alerts found under current filter.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Level</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                  <th>State</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <span className={`alert-pill alert-${alert.level}`}>
                        {alert.level}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{alert.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{alert.message}</td>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className={`status-badge ${alert.acknowledged ? 'status-completed' : 'status-warning'}`}>
                        {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!alert.acknowledged && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => onAcknowledge?.(alert.id)}
                        >
                          Ack
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
