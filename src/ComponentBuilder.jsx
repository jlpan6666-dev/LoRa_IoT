import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { X } from 'lucide-react';

export default function ComponentBuilder({ device, liveData, onClose }) {
  const [type, setType] = useState('Gauge');
  const [name, setName] = useState('');
  const [dataPath, setDataPath] = useState('');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);

  const handleDataPathChange = (e) => {
    const val = e.target.value;
    setDataPath(val);
    
    if (!name) {
      if (val === 'temp') { setName('溫度'); setUnit('°C'); setMin(0); setMax(50); }
      else if (val === 'humi') { setName('濕度'); setUnit('%'); setMin(0); setMax(100); }
      else if (val === 'lux') { setName('照度'); setUnit('lx'); setMin(0); setMax(1000); }
      else if (val === 'bat-v') { setName('電池電壓'); setUnit('V'); setMin(0); setMax(5); }
      else if (val.startsWith('ir-')) { setName(`紅外線 ${val.split('-')[1]}`); setMin(0); setMax(100); }
      else { setName(val); }
    }
  };

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
            <input 
              list="data-keys"
              value={dataPath} 
              onChange={handleDataPathChange} 
              placeholder="例如: temp 或從清單選擇" 
              required 
            />
            <datalist id="data-keys">
              {Object.keys(liveData || {}).filter(k => k !== 'id').map(k => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <small style={{color: '#94a3b8', marginTop: '4px', display:'block'}}>
              點擊輸入框可自動帶入硬體回報的欄位，或手動填寫對應的 JSON Key。<br/>
              <span style={{color: '#f59e0b'}}>💡 提示：網頁剛重新整理時清單會是空的，請等硬體傳送第一筆 MQTT 資料 (約需等候 1 分鐘) 後再點擊。</span>
            </small>
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
