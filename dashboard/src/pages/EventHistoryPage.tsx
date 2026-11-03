import { useState } from 'react';
import type { LogEvent } from '../types';

interface EventHistoryPageProps {
  events: LogEvent[];
}

export function EventHistoryPage({ events }: EventHistoryPageProps) {
  const [search, setSearch] = useState('');

  const filtered = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.eventId.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      (e.stepId && e.stepId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">Telemetry & Event Audit Stream</h3>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Filter events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '5px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-canvas)',
              color: 'var(--text)',
              width: 180,
            }}
          />
        </div>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Type</th>
                <th>Source</th>
                <th>Step</th>
                <th>Confidence</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.eventId}>
                  <td>
                    <code style={{ background: 'var(--bg-canvas)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                      {event.eventId}
                    </code>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{event.type}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{event.source}</td>
                  <td>{event.stepId ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>
                    {event.confidence !== undefined ? `${(event.confidence * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <span className={`status-badge status-${event.status}`}>
                      {event.status}
                    </span>
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
