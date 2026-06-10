import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { X, Bluetooth, PlusCircle, ArrowRight } from 'lucide-react';
import BluetoothManager from './BluetoothManager';

export default function NewDeviceWizard({ onClose, onDeviceAdded }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('lora/sensor/#');
  const [brokerUrl, setBrokerUrl] = useState('wss://broker.emqx.io:8084/mqtt');
  const [mqttUser, setMqttUser] = useState('');
  const [mqttPw, setMqttPw] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Remove old defaultComponents so that the new DeviceView auto-generate logic triggers when first data arrives.
    const defaultComponents = [];

    try {
      const docRef = await addDoc(collection(db, 'devices'), {
        name,
        brokerUrl,
        mqttUser,
        mqttPw,
        topic,
        components: defaultComponents
      });
      onDeviceAdded(docRef.id);
      onClose();
    } catch (err) {
      console.error(err);
      alert('新增失敗: ' + err.message);
    }
    setIsSubmitting(false);
  };

  const handleMqttSync = (status) => {
    if (status.broker) {
      // Auto convert raw broker to websocket url if it's typical
      let url = status.broker;
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        const isSecure = window.location.protocol === 'https:';
        let wsPort = status.port;
        
        // Auto convert standard MQTT TCP ports to standard WebSocket ports
        if (wsPort === '1883' || wsPort === '8883') {
           wsPort = isSecure ? '8084' : '8083';
        }
        
        url = (isSecure || wsPort === '8084' || wsPort === '443') ? `wss://${url}:${wsPort}/mqtt` : `ws://${url}:${wsPort}/mqtt`;
      }
      setBrokerUrl(url);
    }
    if (status.topic) setTopic(status.topic);
    if (status.user) setMqttUser(status.user);
    if (status.pw) setMqttPw(status.pw);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" style={{ maxWidth: step === 1 ? '1100px' : '500px', width: '95%', transition: 'all 0.3s', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>新增裝置精靈</h2>
          <button className="icon-btn" onClick={onClose}><X size={20}/></button>
        </div>

        {step === 1 && (
          <div className="wizard-step">
            <h3 style={{ color: '#3b82f6', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bluetooth size={18} /> 步驟 1：透過藍牙設定硬體 (MQTT)
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '15px', fontSize: '14px' }}>
              請先配對藍牙裝置並設定好網路與 MQTT 伺服器。完成後，請點選「下一步」。
            </p>
            
            <div style={{ marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', background: '#0f172a' }}>
              <BluetoothManager onMqttUpdate={handleMqttSync} />
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={onClose}>取消</button>
              <button className="btn-primary" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                下一步 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="wizard-step">
            <h3 style={{ color: '#10b981', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={18} /> 步驟 2：將裝置加入儀表板
            </h3>
            
            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label>為此裝置取個名稱</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="例如：果園溫室 A 區" required autoFocus />
            </div>
            
            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label>MQTT Broker URL (從藍牙設定自動帶入)</label>
              <input value={brokerUrl} onChange={e=>setBrokerUrl(e.target.value)} required />
            </div>
            
            <div className="input-group" style={{ marginBottom: '15px' }}>
              <label>資料接收主題 (Topic)</label>
              <input value={topic} onChange={e=>setTopic(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>帳號 (選填)</label>
                <input value={mqttUser} onChange={e=>setMqttUser(e.target.value)} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>密碼 (選填)</label>
                <input type="password" value={mqttPw} onChange={e=>setMqttPw(e.target.value)} />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>上一步</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? '處理中...' : '完成並加入'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
