import React, { useState, useEffect, useRef } from 'react';
import DashboardChart from './components/DashboardChart';
import AnomalyTable from './components/AnomalyTable';
import { Activity, AlertTriangle, ShieldCheck, Terminal, Play, Pause, Zap, Sun, Moon } from 'lucide-react';
import StarsBackground from './components/ui/StarsBackground';
import { MagicCard } from './components/ui/MagicCard';
import NumberTicker from './components/ui/NumberTicker';
import { BorderBeam } from './components/ui/BorderBeam';
import { cn } from './lib/utils';
import { useTheme } from './components/ThemeProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080';

function App() {
  const [dataPool, setDataPool] = useState([]);
  const [anomalies, setAnomalies] = useState([]); 
  const [liveLogs, setLiveLogs] = useState([]);   
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const { theme, setTheme } = useTheme();

  const [visibleLines, setVisibleLines] = useState({
    actual: true,
    prediction: true,
    upperBound: true,
    lowerBound: true
  });

  const predictionMapRef = useRef(new Map());

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/simulation/status`)
      .then(res => res.json())
      .then(data => setIsSimulating(data.isRunning))
      .catch(err => console.error("[API] Status could not be fetched:", err));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/stream`);

    ws.onopen = () => console.log('[WebSocket] Connection opened.');
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const { timestamp, dateTimeStr, actualValue, predictions, upperBound, lowerBound, isAnomaly, anomalyType } = payload;

      const oneStepTime = timestamp + 3600000;
      const twoStepTime = timestamp + 7200000;

      if (predictions && predictions.length >= 2) {
        if (!predictionMapRef.current.has(oneStepTime)) predictionMapRef.current.set(oneStepTime, predictions[0]);
        if (!predictionMapRef.current.has(twoStepTime)) predictionMapRef.current.set(twoStepTime, predictions[1]);
      }

      const currentLockedPrediction = predictionMapRef.current.get(timestamp) || (predictions ? predictions[0] : null);
      const isCurrentAnomaly = isAnomaly === true || anomalyType === 'AŞIRI TENHA' || anomalyType === 'AŞIRI YOĞUN';
      const currentLogType = isCurrentAnomaly ? anomalyType : 'NORMAL';

      const newLogItem = {
        timestamp,
        timeStr: dateTimeStr,
        value: actualValue,
        prediction: currentLockedPrediction,
        type: currentLogType
      };

      setDataPool(prev => {
        let updated = prev.filter(item => item.timestamp <= timestamp);
        const currentIdx = updated.findIndex(item => item.timestamp === timestamp);
        const currentPoint = { timestamp, timeStr: dateTimeStr, actual: actualValue, prediction: currentLockedPrediction, upper: upperBound, lower: lowerBound };

        if (currentIdx > -1) updated[currentIdx] = currentPoint;
        else updated.push(currentPoint);

        if (predictions && predictions.length >= 1) {
          updated.push({ timestamp: oneStepTime, timeStr: "+1 Adım", actual: null, prediction: predictions[0], upper: null, lower: null });
        }
        if (predictions && predictions.length >= 2) {
          updated.push({ timestamp: twoStepTime, timeStr: "+2 Adım", actual: null, prediction: predictions[1], upper: null, lower: null });
        }
        return updated.slice(-65);
      });

      if (isCurrentAnomaly) {
        setAnomalies(prev => prev.some(item => item.timestamp === timestamp) ? prev : [...prev, newLogItem]);
      }
      setLiveLogs(prev => prev.some(item => item.timestamp === timestamp) ? prev : [...prev, newLogItem].slice(-40));
    };

    ws.onclose = () => console.log('[WebSocket] Connection closed.');
    return () => ws.close();
  }, []);

  const toggleSimulation = async () => {
    const endpoint = isSimulating ? 'stop' : 'start';
    try {
      const response = await fetch(`${API_BASE_URL}/api/simulation/${endpoint}`, { method: 'POST' });
      if (response.ok) setIsSimulating(!isSimulating);
    } catch (error) {
      console.error("Simulation toggle failed:", error);
    }
  };

  const realDataPoints = dataPool.filter(d => d.actual !== null);
  const latestData = realDataPoints[realDataPoints.length - 1] || {};
  const isLatestAnomalous = anomalies.some(a => a.timeStr === latestData.timeStr);
  const latestAnomalyType = isLatestAnomalous ? anomalies.find(a => a.timeStr === latestData.timeStr)?.type : 'TEMİZ';

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-[#05070f] text-gray-900 dark:text-gray-100 font-sans p-6 overflow-hidden flex flex-col items-center transition-colors duration-500">
      
      {/* Animated Space Background - Hides in Light Mode using CSS */}
      <div className="hidden dark:block">
        <StarsBackground starCount={350} />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-xl transition-colors duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
              <Activity className="text-emerald-600 dark:text-emerald-400 w-8 h-8 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                ChronosWeb AI Dashboard
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time Traffic Forecasting & Anomaly Detection</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={toggleSimulation}
              className={`
                relative group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden
                ${isSimulating 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-900/40' 
                  : 'bg-emerald-500 dark:bg-emerald-600 text-white border border-emerald-600 dark:border-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                }
              `}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isSimulating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isSimulating ? 'Akışı Durdur' : 'Akışı Başlat'}
              </span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Anlık Trafik Hacmi" 
            value={latestData.actual ?? null} 
            unit="Araç" 
            color="text-red-500 dark:text-red-400" 
            glowColor="rgba(239,68,68,0.1)"
          />
          <MetricCard 
            title="Chronos Beklenti" 
            value={latestData.prediction ? Math.round(latestData.prediction) : null} 
            unit="Araç" 
            color="text-emerald-500 dark:text-emerald-400" 
            glowColor="rgba(16,185,129,0.1)"
          />
          
          <MagicCard className="group p-6 shadow-lg bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-800" gradientColor="rgba(16, 185, 129, 0.15)">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 relative z-10">Sistem Durumu</div>
            <div className={`text-3xl font-bold flex items-center gap-3 relative z-10 ${isLatestAnomalous ? (latestAnomalyType === 'AŞIRI YOĞUN' ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400') : 'text-emerald-500 dark:text-emerald-400'}`}>
              {isLatestAnomalous ? <AlertTriangle className="w-8 h-8 animate-pulse" /> : <ShieldCheck className="w-8 h-8" />}
              {latestAnomalyType}
            </div>
            {isLatestAnomalous && (
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 ${latestAnomalyType === 'AŞIRI YOĞUN' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            )}
          </MagicCard>
        </div>

        {/* Chart Section */}
        <div className="relative bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden transition-colors duration-500">
          <BorderBeam size={250} duration={12} delay={9} colorFrom="#10b981" colorTo="#3b82f6" />
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-6 items-center bg-gray-50/80 dark:bg-gray-900/60 relative z-10 transition-colors duration-500">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" /> Çizgi Kontrolleri
            </span>
            <Checkbox label="Gerçek Trafik" checked={visibleLines.actual} onChange={() => setVisibleLines(p => ({ ...p, actual: !p.actual }))} color="accent-red-500" />
            <Checkbox label="Projeksiyon (+2)" checked={visibleLines.prediction} onChange={() => setVisibleLines(p => ({ ...p, prediction: !p.prediction }))} color="accent-emerald-500" />
            <Checkbox label="Üst Sınır (%95)" checked={visibleLines.upperBound} onChange={() => setVisibleLines(p => ({ ...p, upperBound: !p.upperBound }))} color="accent-yellow-500" />
            <Checkbox label="Alt Sınır (%5)" checked={visibleLines.lowerBound} onChange={() => setVisibleLines(p => ({ ...p, lowerBound: !p.lowerBound }))} color="accent-yellow-500" />
          </div>
          <div className="p-6 relative z-10">
            <DashboardChart data={dataPool} visibleLines={visibleLines} selectedTimestamp={selectedTimestamp} />
          </div>
        </div>

        {/* Console Section */}
        <div className="relative bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden transition-colors duration-500">
          <BorderBeam size={200} duration={8} delay={4} colorFrom="#ef4444" colorTo="#f59e0b" />
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 relative z-10 transition-colors duration-500">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
              <Terminal className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> SOC Canlı İzleme Konsolu
            </h3>
          </div>
          <div className="p-6 relative z-10">
             <AnomalyTable 
                anomalies={anomalies} 
                liveLogs={liveLogs} 
                onLogSelect={setSelectedTimestamp} 
                selectedTimestamp={selectedTimestamp} 
              />
          </div>
        </div>
        
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, color, glowColor }) {
  return (
    <MagicCard className="p-6 shadow-lg bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200 dark:border-gray-800" gradientColor="rgba(128, 128, 128, 0.1)">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 relative z-10">{title}</div>
      <div className={`text-4xl font-bold ${color} relative z-10 flex items-baseline gap-2`}>
        {value !== null ? <NumberTicker value={value} className={color} /> : '---'}
        <span className="text-lg font-medium text-gray-500 dark:text-gray-400">{unit}</span>
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 blur-3xl rounded-full" style={{ backgroundColor: glowColor }}></div>
    </MagicCard>
  );
}

function Checkbox({ label, checked, onChange, color }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange} 
        className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer ${color} focus:ring-0 focus:ring-offset-0`} 
      />
      <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

export default App;