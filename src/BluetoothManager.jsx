import React, { useState } from 'react';
import { useBluetoothGateway } from './hooks/useBluetoothGateway';
import { Bluetooth, Wifi, Server, Activity, Send, Save } from 'lucide-react';

export default function BluetoothManager() {
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

  const handleApplyWifi = () => {
    if (!wifiSsid || !wifiPw) return alert('請填寫 SSID 與密碼');
    clearMessages();
    send(`W:${wifiSsid},${wifiPw}`);
  };

  const handleApplyMqtt = () => {
    if (!mqttBroker || !mqttTopic) return alert('請填寫 Broker 與 Topic');
    clearMessages();
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
            <input value={wifiSsid} onChange={e=>setWifiSsid(e.target.value)} placeholder="WiFi 名稱" />
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
                <th style={{ padding: '8px' }}>溫度</th>
                <th style={{ padding: '8px' }}>濕度</th>
                <th style={{ padding: '8px' }}>CO2</th>
                <th style={{ padding: '8px' }}>PM2.5</th>
              </tr>
            </thead>
            <tbody>
              {liveData.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>尚無資料 (等待硬體回報)</td></tr>
              ) : (
                liveData.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px' }}>{d.id || '--'}</td>
                    <td style={{ padding: '8px' }}>{d.temp || d.t || '--'}</td>
                    <td style={{ padding: '8px' }}>{d.hum || d.h || d.rh || '--'}</td>
                    <td style={{ padding: '8px' }}>{d.c || d.cal || '--'}</td>
                    <td style={{ padding: '8px' }}>{d.p2 || d.pm25 || '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
