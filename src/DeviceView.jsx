import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import mqtt from 'mqtt';
import ReactECharts from 'echarts-for-react';
import { Settings, Plus, X, Activity } from 'lucide-react';
import ComponentBuilder from './ComponentBuilder';

export default function DeviceView({ deviceId }) {
  const [device, setDevice] = useState(null);
  const [mqttStatus, setMqttStatus] = useState('offline');
  const [liveData, setLiveData] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const clientRef = useRef(null);

  // Fetch device from Firebase
  useEffect(() => {
    if (!deviceId) return;
    const unsub = onSnapshot(doc(db, 'devices', deviceId), (docSnap) => {
      if (docSnap.exists()) {
        setDevice({ id: docSnap.id, ...docSnap.data() });
      } else {
        setDevice(null);
      }
    });
    return () => unsub();
  }, [deviceId]);

  // Connect to MQTT when device config changes
  useEffect(() => {
    if (!device) return;

    // Disconnect previous client
    if (clientRef.current) {
      clientRef.current.end();
      clientRef.current = null;
    }

    if (!device.brokerUrl) return;

    setMqttStatus('connecting');
    addLog(`正在嘗試連線至: ${device.brokerUrl}`);

    const options = {
      clientId: `react_${Math.random().toString(16).substr(2, 8)}`,
      keepalive: 60,
      reconnectPeriod: 3000
    };
    if (device.mqttUser) options.username = device.mqttUser;
    if (device.mqttPw) options.password = device.mqttPw;

    try {
      const client = mqtt.connect(device.brokerUrl, options);
      clientRef.current = client;

      client.on('connect', () => {
        setMqttStatus('online');
        addLog('✅ 連線成功！');
        if (device.topic) {
          client.subscribe(device.topic);
          addLog(`已訂閱主題: ${device.topic}`);
        }
      });

      client.on('message', (topic, message) => {
        try {
          const payloadString = message.toString();
          const data = JSON.parse(payloadString);
          // Update live data, merging with previous
          setLiveData(prev => ({ ...prev, ...data }));
        } catch (e) {
          // not JSON, ignore or log
        }
      });

      client.on('error', (err) => {
        setMqttStatus('error');
        addLog(`❌ 連線錯誤: ${err.message}`);
      });

      client.on('offline', () => {
        setMqttStatus('offline');
      });

    } catch (e) {
      setMqttStatus('error');
      addLog(`❌ 連線發起失敗: ${e.message}`);
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
    };
  }, [device?.brokerUrl, device?.mqttUser, device?.mqttPw, device?.topic]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), `[${time}] ${msg}`]);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await updateDoc(doc(db, 'devices', device.id), {
      name: fd.get('name'),
      brokerUrl: fd.get('brokerUrl'),
      mqttUser: fd.get('mqttUser'),
      mqttPw: fd.get('mqttPw'),
      topic: fd.get('topic'),
    });
    setShowSettings(false);
  };

  const removeComponent = async (compId) => {
    if (!window.confirm('確定要移除此圖表嗎？')) return;
    const newComps = device.components.filter(c => c.id !== compId);
    await updateDoc(doc(db, 'devices', device.id), { components: newComps });
  };

  if (!device) return <div className="p-6 text-white">載入中...</div>;

  return (
    <div className="device-view">
      <header className="device-header">
        <div>
          <h1>{device.name}</h1>
          <div className={`status-badge ${mqttStatus}`}>
            {mqttStatus === 'online' ? '🟢 已連線' : mqttStatus === 'connecting' ? '🟡 連線中...' : '🔴 離線'}
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setShowBuilder(true)} title="新增圖表元件">
            <Plus size={20} /> 新增元件
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(!showSettings)} title="裝置設定">
            <Settings size={20} /> 設定
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel card">
          <h3><Settings size={18} className="inline-icon" /> 裝置連線設定</h3>
          <form onSubmit={saveSettings} className="settings-form">
            <div className="input-group">
              <label>裝置名稱</label>
              <input name="name" defaultValue={device.name} required />
            </div>
            <div className="input-group">
              <label>MQTT Broker (WebSocket URL)</label>
              <input name="brokerUrl" defaultValue={device.brokerUrl} required />
            </div>
            <div className="input-group">
              <label>帳號 (Username)</label>
              <input name="mqttUser" defaultValue={device.mqttUser} />
            </div>
            <div className="input-group">
              <label>密碼 (Password)</label>
              <input name="mqttPw" type="password" defaultValue={device.mqttPw} />
            </div>
            <div className="input-group">
              <label>訂閱主題 (Topic)</label>
              <input name="topic" defaultValue={device.topic} required />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowSettings(false)}>取消</button>
              <button type="submit" className="btn-primary">儲存並重新連線</button>
            </div>
          </form>
        </div>
      )}

      <div className="components-grid">
        {device.components && device.components.map(comp => (
          <Widget 
            key={comp.id} 
            config={comp} 
            value={liveData[comp.dataPath]} 
            onRemove={() => removeComponent(comp.id)}
          />
        ))}
        {(!device.components || device.components.length === 0) && (
          <div className="empty-state">
            <Activity size={48} className="empty-icon" />
            <p>目前沒有任何圖表元件</p>
            <button className="btn-primary" onClick={() => setShowBuilder(true)}>馬上新增一個！</button>
          </div>
        )}
      </div>

      <div className="log-panel">
        {logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>

      {showBuilder && (
        <ComponentBuilder 
          device={device} 
          onClose={() => setShowBuilder(false)} 
        />
      )}
    </div>
  );
}

function Widget({ config, value, onRemove }) {
  // Safe default value parsing
  const valNum = Number(value);
  const isValValid = !isNaN(valNum) && value !== undefined;
  const displayVal = isValValid ? valNum.toFixed(1) : '--';

  let option = {};

  if (config.type === 'Stat') {
    return (
      <div className="widget card stat-widget">
        <button className="widget-remove" onClick={onRemove}><X size={14}/></button>
        <div className="widget-title">{config.name}</div>
        <div className="stat-value">
          {displayVal} <span className="stat-unit">{config.unit || ''}</span>
        </div>
      </div>
    );
  }

  if (config.type === 'Gauge') {
    option = {
      series: [{
        type: 'gauge',
        progress: { show: true, width: 10 },
        axisLine: { lineStyle: { width: 10 } },
        axisTick: { show: false },
        splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
        pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '12%', width: 10, offsetCenter: [0, '-60%'] },
        title: { show: false },
        detail: { valueAnimation: true, fontSize: 30, offsetCenter: [0, '40%'], formatter: `{value} ${config.unit||''}` },
        data: [{ value: isValValid ? valNum : 0, name: config.name }],
        min: config.min || 0,
        max: config.max || 100
      }]
    };
  } else if (config.type === 'Line' || config.type === 'Bar') {
    // For a real line/bar chart we would need history.
    // For simplicity in this live view, we just show a static or simple gauge-like bar, 
    // OR we can implement a tiny sliding window history if we store state inside the widget.
    // To implement history, we'd need a useEffect inside the Widget component.
    return <HistoryChartWidget config={config} value={value} onRemove={onRemove} />;
  }

  return (
    <div className="widget card">
      <button className="widget-remove" onClick={onRemove}><X size={14}/></button>
      <div className="widget-title">{config.name}</div>
      <ReactECharts option={option} style={{ height: '250px', width: '100%' }} theme="dark" />
    </div>
  );
}

// A specialized widget that keeps its own sliding window history for Line/Bar charts
function HistoryChartWidget({ config, value, onRemove }) {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      setHistory(prev => {
        const next = [...prev, [timeStr, Number(value)]];
        if (next.length > 20) next.shift(); // Keep last 20 points
        return next;
      });
    }
  }, [value]);

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', boundaryGap: config.type === 'Bar' },
    yAxis: { type: 'value' },
    series: [{
      name: config.name,
      type: config.type.toLowerCase(), // 'line' or 'bar'
      data: history,
      smooth: true,
      itemStyle: { color: '#3b82f6' },
      areaStyle: config.type === 'Line' ? {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.5)' }, { offset: 1, color: 'rgba(59,130,246,0)' }]
        }
      } : undefined
    }]
  };

  return (
    <div className="widget card">
      <button className="widget-remove" onClick={onRemove}><X size={14}/></button>
      <div className="widget-title">{config.name} <span style={{fontSize:'12px', color:'#94a3b8'}}>({config.dataPath})</span></div>
      <ReactECharts option={option} style={{ height: '250px', width: '100%' }} theme="dark" />
    </div>
  );
}
