import React from 'react';
import { Plus, Cpu, Activity } from 'lucide-react';

export default function HomeOverview({ devices, onAddDevice, onSelectDevice }) {
  if (devices.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#94a3b8'
      }}>
        <Cpu size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
        <h2 style={{ color: '#f8fafc', marginBottom: '10px' }}>尚未建立任何裝置</h2>
        <p style={{ marginBottom: '30px' }}>請先新增裝置來接收您的感測器數據</p>
        <button className="btn-primary" onClick={onAddDevice} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '16px' }}>
          <Plus size={20} /> 新增第一個裝置
        </button>
      </div>
    );
  }

  return (
    <div className="home-overview">
      <div className="header" style={{ marginBottom: '30px' }}>
        <h2>儀表板總覽</h2>
        <p style={{ color: 'var(--text-secondary)' }}>您目前共有 {devices.length} 個裝置</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {devices.map(dev => (
          <div 
            key={dev.id} 
            className="card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}
            onClick={() => onSelectDevice(dev.id)}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#3b82f6" /> {dev.name}
              </h3>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Topic: {dev.topic}</p>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                {dev.components?.length || 0} 個圖表
              </span>
            </div>
          </div>
        ))}

        <div 
          className="card" 
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed rgba(255,255,255,0.1)',
            background: 'transparent',
            minHeight: '140px'
          }}
          onClick={onAddDevice}
        >
          <Plus size={32} color="#64748b" style={{ marginBottom: '10px' }} />
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>新增裝置</span>
        </div>
      </div>
    </div>
  );
}
