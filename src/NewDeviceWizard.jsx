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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 預設建立的元件清單
    const defaultComponents = [
      { id: Date.now().toString() + '1', type: 'value', title: '🪲 捕蟲數量 (通道 A)', dataKey: 'chA', unit: '隻', color: '#10b981' },
      { id: Date.now().toString() + '2', type: 'value', title: '🪲 捕蟲數量 (通道 B)', dataKey: 'chB', unit: '隻', color: '#3b82f6' },
      { id: Date.now().toString() + '3', type: 'value', title: '🌡️ 環境溫度', dataKey: 'temp', unit: '°C', color: '#f59e0b' },
      { id: Date.now().toString() + '4', type: 'value', title: '💧 環境濕度', dataKey: 'hum', unit: '%', color: '#0ea5e9' },
      { id: Date.now().toString() + '5', type: 'value', title: '☀️ 照度 (Lux)', dataKey: 'lux', unit: 'lx', color: '#eab308' },
      { id: Date.now().toString() + '6', type: 'value', title: '🔋 電池電壓', dataKey: 'bat', unit: 'V', color: '#8b5cf6' }
    ];

    try {
      const docRef = await addDoc(collection(db, 'devices'), {
        name,
        brokerUrl,
        mqttUser: '',
        mqttPw: '',
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

  return (
    <div className="modal-overlay">
      <div className="modal-content card" style={{ maxWidth: step === 1 ? '900px' : '500px', width: '95%', transition: 'all 0.3s', maxHeight: '90vh', overflowY: 'auto' }}>
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
              <BluetoothManager />
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
          <div className="wizard-step">
            <h3 style={{ color: '#10b981', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={18} /> 步驟 2：將裝置加入儀表板
            </h3>
            <form onSubmit={handleSubmit} className="settings-form" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="input-group" style={{ marginBottom: '15px' }}>
                <label>為此裝置取個名稱</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="例如: 客廳感測器" required autoFocus />
              </div>
              <div className="input-group" style={{ marginBottom: '15px' }}>
                <label>MQTT Broker URL (對應您剛剛在硬體設定的伺服器)</label>
                <input value={brokerUrl} onChange={e=>setBrokerUrl(e.target.value)} required />
              </div>
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>資料接收主題 (Topic)</label>
                <input value={topic} onChange={e=>setTopic(e.target.value)} required />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>上一步</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? '處理中...' : '完成新增並前往建立圖表'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
