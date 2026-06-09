import React, { useState } from 'react';
import { useBluetoothGateway } from './hooks/useBluetoothGateway';
import { Bluetooth, Wifi, Server, Activity, Send, Save } from 'lucide-react';

export default function BluetoothManager({ onMqttUpdate }) {
  const {
    connect,
    disconnect,
    send,
    deviceInfo,
    wifiStatus,
    wifiList,
    mqttStatus,
    messages,
    liveData,
    logs,
    clearMessages
  } = useBluetoothGateway();

  // Local forms state
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPw, setWifiPw] = useState('');
  
  const [mqttBroker, setMqttBroker] = useState('');
  const [mqttPort, setMqttPort] = useState('1883');
  const [mqttTopic, setMqttTopic] = useState('');
  const [mqttUser, setMqttUser] = useState('');
  const [mqttPw, setMqttPw] = useState('');

  // Sync form when status loaded
  React.useEffect(() => {
    if (wifiStatus.ssid) setWifiSsid(wifiStatus.ssid);
  }, [wifiStatus.ssid]);

  React.useEffect(() => {
    if (mqttStatus.broker) {
      setMqttBroker(mqttStatus.broker);
      setMqttPort(mqttStatus.port);
      setMqttTopic(mqttStatus.topic);
      setMqttUser(mqttStatus.user);
      setMqttPw(mqttStatus.pw);
    }
  }, [mqttStatus]);

  React.useEffect(() => {
    if (onMqttUpdate) {
      onMqttUpdate({ broker: mqttBroker, port: mqttPort, topic: mqttTopic, user: mqttUser, pw: mqttPw });
    }
  }, [mqttBroker, mqttPort, mqttTopic, mqttUser, mqttPw, onMqttUpdate]);

  const handleScanWifi = () => {
    // 讓裝置掃描 WiFi
    send('WIFI:SCAN');
  };

  const handleApplyWifi = () => {
    if (!wifiSsid || !wifiPw) return alert('請填寫 SSID 與密碼');
    setMessages(prev => ({ ...prev, wifi: '連線中...' }));
    send(`W:${wifiSsid},${wifiPw}`);
  };

  const handleApplyMqtt = () => {
    if (!mqttBroker || !mqttTopic) return alert('請填寫 Broker 與 Topic');
    setMessages(prev => ({ ...prev, mqtt: '儲存中...' }));
    send(`MQTT:SET:${mqttBroker},${mqttPort},${mqttTopic},1,${mqttUser},${mqttPw}`);
  };

  const handleToggleMqtt = () => {
    send(`MQTT:EN:${mqttStatus.enabled ? '0' : '1'}`);
  };

  return (
    <div className="bluetooth-manager">
      <div className="card conn-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Bluetooth size={24} color={deviceInfo.connected ? '#10b981' : '#64748b'} />
              {deviceInfo.connected ? `已連線: ${deviceInfo.name}` : '藍牙未連線'}
            </h2>
            <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '13px' }}>透過 Web Bluetooth API 配置硬體</p>
          </div>
          <button 
            className={`btn-primary ${deviceInfo.connected ? 'btn-danger' : ''}`}
            onClick={deviceInfo.connected ? disconnect : connect}
          >
            {deviceInfo.connected ? '中斷連線' : '配對裝置'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* WiFi Config */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Wifi size={18} /> WiFi 設定
          </h3>
          <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '13px' }}>
            狀態: {wifiStatus.connected ? <span style={{color: '#10b981'}}>✅ 已連線 ({wifiStatus.ip})</span> : '❌ 未連線'}
          </div>
          {messages.wifi && <div style={{ marginBottom: '10px', fontSize: '12px', color: '#3b82f6' }}>{messages.wifi}</div>}
          
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label>SSID</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                list="wifi-list"
                value={wifiSsid} 
                onChange={e=>setWifiSsid(e.target.value)} 
                placeholder="WiFi 名稱" 
                style={{ flex: 1 }}
              />
              <datalist id="wifi-list">
                {wifiList.map(ssid => <option key={ssid} value={ssid} />)}
              </datalist>
              <button type="button" className="btn-secondary" onClick={handleScanWifi} disabled={!deviceInfo.connected} style={{ whiteSpace: 'nowrap', padding: '0 10px', fontSize: '13px' }}>
                掃描周圍
              </button>
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: '15px' }}>
            <label>密碼</label>
            <input type="password" value={wifiPw} onChange={e=>setWifiPw(e.target.value)} placeholder="WiFi 密碼" />
          </div>
          <button className="btn-primary" onClick={handleApplyWifi} disabled={!deviceInfo.connected} style={{ width: '100%' }}>
            <Save size={16} /> 套用網路設定
          </button>
        </div>

        {/* MQTT Config */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Server size={18} /> MQTT 設定
          </h3>
          <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
            <span>狀態: {mqttStatus.connected ? <span style={{color: '#10b981'}}>✅ 已連線</span> : '❌ 未連線'}</span>
            <button className="icon-btn" onClick={handleToggleMqtt} disabled={!deviceInfo.connected} style={{ fontSize: '12px', padding: '2px 6px' }}>
              {mqttStatus.enabled ? '⏹ 停用' : '▶ 啟用'}
            </button>
          </div>
          {messages.mqtt && <div style={{ marginBottom: '10px', fontSize: '12px', color: '#3b82f6' }}>{messages.mqtt}</div>}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div className="input-group" style={{ flex: 2 }}>
              <label>Broker URL</label>
              <input value={mqttBroker} onChange={e=>setMqttBroker(e.target.value)} placeholder="broker.emqx.io" />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Port</label>
              <input value={mqttPort} onChange={e=>setMqttPort(e.target.value)} placeholder="1883" />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label>Topic</label>
            <input value={mqttTopic} onChange={e=>setMqttTopic(e.target.value)} placeholder="lora/sensor/#" />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>帳號 (選填)</label>
              <input value={mqttUser} onChange={e=>setMqttUser(e.target.value)} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>密碼 (選填)</label>
              <input type="password" value={mqttPw} onChange={e=>setMqttPw(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleApplyMqtt} disabled={!deviceInfo.connected} style={{ width: '100%' }}>
            <Save size={16} /> 套用 MQTT 設定
          </button>
        </div>

      </div>

      {/* Live Data Preview */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <Activity size={18} /> 即時感測器數據預覽 (LoRa)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '8px' }}>裝置 ID</th>
                <th style={{ padding: '8px' }}>溫度 (°C)</th>
                <th style={{ padding: '8px' }}>濕度 (%)</th>
                <th style={{ padding: '8px' }}>通道 A</th>
                <th style={{ padding: '8px' }}>通道 B</th>
                <th style={{ padding: '8px' }}>照度 (lx)</th>
                <th style={{ padding: '8px' }}>電壓 (V)</th>
              </tr>
            </thead>
            <tbody>
              {liveData.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>尚無資料 (等待硬體回報)</td></tr>
              ) : (
                liveData.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}>{d.id || '--'}</td>
                    <td style={{ padding: '8px' }}>{d.temp || '--'}</td>
                    <td style={{ padding: '8px' }}>{d.humi || '--'}</td>
                    <td style={{ padding: '8px' }}>{d['ir-1'] || '--'}</td>
                    <td style={{ padding: '8px' }}>{d['ir-2'] || '--'}</td>
                    <td style={{ padding: '8px' }}>{d.lux || '--'}</td>
                    <td style={{ padding: '8px' }}>{d['bat-v'] || '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <Activity size={18} /> 藍牙通訊日誌
        </h3>
        <div style={{
          background: '#0f172a',
          padding: '10px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '13px',
          height: '200px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {logs.map((log, i) => (
            <div key={i} style={{ 
              color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#f8fafc',
              marginBottom: '4px',
              wordBreak: 'break-all'
            }}>
              <span style={{ color: '#64748b' }}>[{log.time.toLocaleTimeString()}]</span> {log.msg}
            </div>
          ))}
          {logs.length === 0 && <div style={{ color: '#64748b' }}>尚無通訊紀錄...</div>}
        </div>
      </div>
    </div>
  );
}
