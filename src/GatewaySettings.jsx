import React from 'react';
import BluetoothManager from './BluetoothManager';

export default function GatewaySettings() {
  return (
    <div className="gateway-settings">
      <div className="header">
        <h2>IAQ 接收閘道 (藍牙設定)</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          直接透過網頁藍牙 API 設定硬體節點的 WiFi 與 MQTT 連線狀態。
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <BluetoothManager />
      </div>
    </div>
  );
}
