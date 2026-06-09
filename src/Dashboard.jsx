import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import DeviceView from './DeviceView';
import GatewaySettings from './GatewaySettings';
import NewDeviceWizard from './NewDeviceWizard';
import HomeOverview from './HomeOverview';
import { Settings, Plus, LayoutDashboard, LogOut, Trash2, Home, Activity } from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const [devices, setDevices] = useState([]);
  const [activeView, setActiveView] = useState('home'); // 'home', 'gateway', or deviceId
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Listen to devices from Firebase
    const q = collection(db, 'devices');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devs = [];
      snapshot.forEach((doc) => {
        devs.push({ id: doc.id, ...doc.data() });
      });
      setDevices(devs);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteDevice = async (id, name) => {
    if (window.confirm(`確定要刪除裝置「${name}」嗎？這將會刪除其所有圖表設定。`)) {
      if (activeView === id) setActiveView('home');
      await deleteDoc(doc(db, 'devices', id));
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Activity size={28} color="var(--primary)" />
          <h2>LoRa 控制中心</h2>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => setActiveView('home')}
          >
            <Home size={20} /> 總覽首頁
          </div>
          <div 
            className={`nav-item ${activeView === 'gateway' ? 'active' : ''}`}
            onClick={() => setActiveView('gateway')}
          >
            <Settings size={20} /> IAQ 藍牙設定
          </div>
          
          <div className="nav-divider">已連結裝置</div>
          {devices.map(dev => (
            <div 
              key={dev.id} 
              className={`nav-item ${activeView === dev.id ? 'active' : ''}`}
              onClick={() => setActiveView(dev.id)}
            >
              <LayoutDashboard size={20} />
              <span className="nav-label">{dev.name}</span>
              <button 
                className="icon-btn delete-btn" 
                onClick={(e) => { e.stopPropagation(); handleDeleteDevice(dev.id, dev.name); }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="nav-item add-item" onClick={() => setShowWizard(true)}>
            <Plus size={20} /> 新增裝置
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={20} /> 登出系統
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeView === 'home' ? (
          <HomeOverview 
            devices={devices} 
            onAddDevice={() => setShowWizard(true)} 
            onSelectDevice={(id) => setActiveView(id)}
          />
        ) : activeView === 'gateway' ? (
          <GatewaySettings />
        ) : (
          <DeviceView deviceId={activeView} />
        )}
      </main>

      {showWizard && (
        <NewDeviceWizard 
          onClose={() => setShowWizard(false)} 
          onDeviceAdded={(newId) => setActiveView(newId)}
        />
      )}
    </div>
  );
}
