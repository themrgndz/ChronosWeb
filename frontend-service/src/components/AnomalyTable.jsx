import React, { useEffect, useRef } from 'react';

function AnomalyTable({ anomalies, liveLogs, onLogSelect, selectedTimestamp }) {
  const liveConsoleRef = useRef(null);

  useEffect(() => {
    if (liveConsoleRef.current) {
      liveConsoleRef.current.scrollTop = liveConsoleRef.current.scrollHeight;
    }
  }, [liveLogs]);

  const renderLogLine = (log, isAnomalyOnly) => {
    const isSelected = selectedTimestamp === log.timestamp;
    let logColor = '#9ca3af'; 
    let statusWeight = 'normal';

    if (log.type === 'AŞIRI YOĞUN') {
      logColor = '#ef4444'; 
      statusWeight = 'bold';
    } else if (log.type === 'AŞIRI TENHA') {
      logColor = '#3b82f6'; 
      statusWeight = 'bold';
    }

    return (
      <div 
        key={`${log.timestamp}-${log.type}-${isAnomalyOnly ? 'anomaly' : 'live'}`}
        style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 8px',
          borderBottom: '1px solid #111827',
          backgroundColor: isSelected ? '#1e293b' : 'transparent',
          borderRadius: '4px',
          color: logColor,
          fontSize: '12.5px'
        }}
      >
        <div style={{ flex: 1, whiteSpace: 'pre-wrap', fontFamily: '"Fira Code", monospace' }}>
          <span style={{ color: '#4b5563' }}>[{log.timeStr}]</span>
          {` Trf: `}<span style={{ fontWeight: 'bold' }}>{String(log.value).padEnd(2)}</span>
          {` | Bkl: `}<span style={{ color: '#10b981' }}>{String(Math.round(log.prediction)).padEnd(2)}</span>
          {` | `}<span style={{ color: logColor, fontWeight: statusWeight }}>{log.type}</span>
        </div>

        {log.type !== 'NORMAL' && (
          <button
            onClick={() => onLogSelect(isSelected ? null : log.timestamp)}
            style={{
              padding: '1px 6px',
              backgroundColor: isSelected ? '#4b5563' : '#f59e0b',
              color: isSelected ? '#fff' : '#111827',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold'
            }}
          >
            {isSelected ? 'Kaldır' : 'Parlat 🚀'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
      
      {/* 📌 SOL PANEL: SABİT KALAN ANOMALİLER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📌 Sabitlenmiş Güvenlik Olayları ({anomalies.length})
        </div>
        <div style={{ backgroundColor: '#05070f', border: '1px solid #374151', borderRadius: '8px', padding: '10px', height: '260px', overflowY: 'auto' }}>
          {anomalies.length === 0 ? (
            <div style={{ padding: '20px', color: '#4b5563', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px' }}>
              Henüz anomali olayı yakalanmadı agam.
            </div>
          ) : (
            anomalies.map(log => renderLogLine(log, true))
          )}
        </div>
      </div>

      {/* ⚡ SAĞ PANEL: CANLI AKAN TÜM SUNUCU LOGLARI */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ⚡ Canlı Sunucu Akış Hattı (Maks. 40 Satır)
        </div>
        {/* ref={liveConsoleRef} atamasını buraya çaktık brom */}
        <div 
          ref={liveConsoleRef}
          style={{ backgroundColor: '#05070f', border: '1px solid #1f2937', borderRadius: '8px', padding: '10px', height: '260px', overflowY: 'auto' }}
        >
          {liveLogs.map(log => renderLogLine(log, false))}
        </div>
      </div>

    </div>
  );
}

export default AnomalyTable;