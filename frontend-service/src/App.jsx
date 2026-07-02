import React, { useState, useEffect, useRef } from 'react';
import DashboardChart from './components/DashboardChart';
import AnomalyTable from './components/AnomalyTable';
import { Activity, AlertTriangle, ShieldCheck, Terminal, Play, Pause } from 'lucide-react'; // Play ve Pause ikonları eklendi

function App() {
  const [dataPool, setDataPool] = useState([]);
  const [anomalies, setAnomalies] = useState([]); 
  const [liveLogs, setLiveLogs] = useState([]);   
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false); // Simülasyon durumu state'i
  
  const [visibleLines, setVisibleLines] = useState({
    actual: true,
    prediction: true,
    upperBound: true,
    lowerBound: true
  });

  const firstPredictionsRef = useRef(new Map());

  // İlk açılışta backend'deki simülasyon durumunu kontrol et brom
  useEffect(() => {
    fetch('http://localhost:8080/api/simulation/status')
      .then(res => res.json())
      .then(data => setIsSimulating(data.isRunning))
      .catch(err => console.error("[API] Durum alınamadı brom:", err));
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/stream');

    ws.onopen = () => console.log('[WebSocket] Canlı veri hattı açıldı brom.');
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const { timestamp, dateTimeStr, actualValue, predictedMedian, upperBound, lowerBound, isAnomaly, anomalyType } = payload;

      if (!firstPredictionsRef.current.has(timestamp)) {
        firstPredictionsRef.current.set(timestamp, predictedMedian);
      }
      const lockedPrediction = firstPredictionsRef.current.get(timestamp);

      const isCurrentAnomaly = isAnomaly === true || anomalyType === 'AŞIRI TENHA' || anomalyType === 'AŞIRI YOĞUN';
      const currentLogType = isCurrentAnomaly ? anomalyType : 'NORMAL';

      const newLogItem = {
        timestamp,
        timeStr: dateTimeStr,
        value: actualValue,
        prediction: lockedPrediction,
        type: currentLogType
      };

      setDataPool(prev => {
        if (prev.some(item => item.timestamp === timestamp)) return prev;
        const newPoint = {
          timestamp,
          timeStr: dateTimeStr,
          actual: actualValue,
          prediction: lockedPrediction,
          upper: upperBound,
          lower: lowerBound
        };
        return [...prev, newPoint].slice(-60);
      });

      if (isCurrentAnomaly) {
        setAnomalies(prev => {
          if (prev.some(item => item.timestamp === timestamp)) return prev;
          return [...prev, newLogItem];
        });
      }

      setLiveLogs(prev => {
        if (prev.some(item => item.timestamp === timestamp)) return prev;
        return [...prev, newLogItem].slice(-40);
      });
    };

    ws.onclose = () => console.log('[WebSocket] Bağlantı koptu.');
    return () => ws.close();
  }, []);

  // Akışı başlatma ve durdurma tetikleyicisi
  const toggleSimulation = async () => {
    const endpoint = isSimulating ? 'stop' : 'start';
    try {
      const response = await fetch(`http://localhost:8080/api/simulation/${endpoint}`, {
        method: 'POST'
      });
      if (response.ok) {
        setIsSimulating(!isSimulating);
      }
    } catch (error) {
      console.error("Simülasyon durumu değiştirilemedi agam:", error);
    }
  };

  const latestData = dataPool[dataPool.length - 1] || {};
  const isLatestAnomalous = anomalies.some(a => a.timeStr === latestData.timeStr);
  const latestAnomalyType = isLatestAnomalous ? anomalies.find(a => a.timeStr === latestData.timeStr)?.type : 'TEMİZ';

  return (
    <div style={{ width: '100%', padding: '24px', minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      
      {/* Üst Başlık ve Kontrol Butonu Alanı */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: '#ffffff', fontSize: '26px', letterSpacing: '0.5px' }}>
          <Activity color="#10b981" size={32} style={{ filter: 'drop-shadow(0 0 8px #10b981)' }} /> 
          Canlı Trafik Analiz & Forecasting Paneli
        </h2>

        {/* Canlı Akış Başlat/Durdur Butonu */}
        <button 
          onClick={toggleSimulation}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isSimulating ? '#ef4444' : '#10b981',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: isSimulating ? '0 0 12px rgba(239, 68, 68, 0.4)' : '0 0 12px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.3s ease'
          }}
        >
          {isSimulating ? <Pause size={18} /> : <Play size={18} />}
          {isSimulating ? 'Akışı Durdur' : 'Akışı Başlat'}
        </button>
      </div>

      {/* Kartlar */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <div style={{ fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Anlık Trafik Hacmi</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{latestData.actual ?? '---'} <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#6b7280' }}>Araç</span></div>
        </div>
        <div style={{ flex: 1, background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <div style={{ fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Chronos Beklentisi (Median)</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{latestData.prediction ? Math.round(latestData.prediction) : '---'} <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#6b7280' }}>Araç</span></div>
        </div>
        <div style={{ flex: 1, background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <div style={{ fontSize: '13px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Sistem Durumu</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: isLatestAnomalous ? (latestAnomalyType === 'AŞIRI YOĞUN' ? '#ef4444' : '#3b82f6') : '#10b981', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {isLatestAnomalous ? <AlertTriangle size={26} color={latestAnomalyType === 'AŞIRI YOĞUN' ? '#ef4444' : '#3b82f6'}/> : <ShieldCheck size={26} color="#10b981"/>}
            {latestAnomalyType}
          </div>
        </div>
      </div>

      {/* Kontroller */}
      <div style={{ background: '#111827', padding: '14px 20px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '20px', display: 'flex', gap: '24px', alignItems: 'center', color: '#e5e7eb', fontSize: '14px' }}>
        <span style={{ fontWeight: 'bold', color: '#9ca3af' }}>Çizgi Kontrolleri:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" checked={visibleLines.actual} onChange={() => setVisibleLines(p => ({ ...p, actual: !p.actual }))} /> Gerçek Trafik</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" checked={visibleLines.prediction} onChange={() => setVisibleLines(p => ({ ...p, prediction: !p.prediction }))} /> Gelecek Projeksiyonu</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" checked={visibleLines.upperBound} onChange={() => setVisibleLines(p => ({ ...p, upperBound: !p.upperBound }))} /> Üst Sınır (%95)</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" checked={visibleLines.lowerBound} onChange={() => setVisibleLines(p => ({ ...p, lowerBound: !p.lowerBound }))} /> Alt Sınır (%5)</label>
      </div>

      {/* Grafik */}
      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
        <DashboardChart data={dataPool} visibleLines={visibleLines} selectedTimestamp={selectedTimestamp} />
      </div>

      {/* Split Konsol Paneli */}
      <div style={{ background: '#111827', padding: '24px', borderRadius: '12px', border: '1px solid #1f2937', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Terminal size={22} color="#10b981" /> Çift Kanallı Canlı İzleme Konsolu (SOC)
        </h3>
        <AnomalyTable 
          anomalies={anomalies} 
          liveLogs={liveLogs} 
          onLogSelect={setSelectedTimestamp} 
          selectedTimestamp={selectedTimestamp} 
        />
      </div>
    </div>
  );
}

export default App;