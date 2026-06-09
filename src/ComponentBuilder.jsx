import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { X } from 'lucide-react';

export default function ComponentBuilder({ device, onClose }) {
  const [type, setType] = useState('Stat');
  const [name, setName] = useState('');
  const [dataPath, setDataPath] = useState('');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newComponent = {
      id: `comp_${Date.now()}`,
      type,
      name,
      dataPath,
      unit
    };

    if (type === 'Gauge') {
      newComponent.min = Number(min);
      newComponent.max = Number(max);
    }

    const updatedComponents = [...(device.components || []), newComponent];
    
    await updateDoc(doc(db, 'devices', device.id), {
      components: updatedComponents
    });
    
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card">
        <div className="modal-header">
          <h2>新增圖表元件</h2>
          <button className="icon-btn" onClick={onClose}><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="input-group">
            <label>元件名稱 (顯示標題)</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="例如: 環境溫度" required />
          </div>
          
          <div className="input-group">
            <label>圖表類型</label>
            <select value={type} onChange={e=>setType(e.target.value)}>
              <option value="Stat">數值顯示卡片 (Stat)</option>
              <option value="Line">折線圖 (Line)</option>
              <option value="Bar">長條圖 (Bar)</option>
              <option value="Gauge">儀表盤 (Gauge)</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>數據來源 JSON Key (Data Path)</label>
            <input value={dataPath} onChange={e=>setDataPath(e.target.value)} placeholder="例如: temp" required />
            <small style={{color: '#94a3b8', marginTop: '4px', display:'block'}}>填寫 MQTT Payload 中對應的 Key，例如 Payload 是 {"{"}"temp": 25.4{"}"}，這裡就填 temp。</small>
          </div>

          <div className="input-group">
            <label>單位 (非必填)</label>
            <input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="例如: °C, %, lx" />
          </div>

          {type === 'Gauge' && (
            <div style={{display:'flex', gap:'10px'}}>
              <div className="input-group" style={{flex:1}}>
                <label>最小值</label>
                <input type="number" value={min} onChange={e=>setMin(e.target.value)} />
              </div>
              <div className="input-group" style={{flex:1}}>
                <label>最大值</label>
                <input type="number" value={max} onChange={e=>setMax(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-actions mt-4">
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">確認新增</button>
          </div>
        </form>
      </div>
    </div>
  );
}
