import { useState, useRef, useCallback } from 'react';

const UART_SERV = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UUID_TX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // RX from device perspective
const UUID_RX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // TX from device perspective

export function useBluetoothGateway() {
  const [deviceInfo, setDeviceInfo] = useState({ name: null, connected: false });
  const [logs, setLogs] = useState([]);
  
  // States to hold parsed device info
  const [wifiStatus, setWifiStatus] = useState({ ssid: '', connected: false, ip: '' });
  const [wifiList, setWifiList] = useState([]);
  const [mqttStatus, setMqttStatus] = useState({ broker: '', port: '1883', topic: '', enabled: false, connected: false, user: '', pw: '' });
  const [messages, setMessages] = useState({ wifi: '', mqtt: '', lora: '' });
  
  // Realtime Data
  const [liveData, setLiveData] = useState([]);
  
  // Refs for GATT connection
  const deviceRef = useRef(null);
  const txCharRef = useRef(null);
  const rxCharRef = useRef(null);
  const sendQueue = useRef(Promise.resolve());

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date(), msg, type }]);
  }, []);

  const send = useCallback((msg) => {
    sendQueue.current = sendQueue.current.then(async () => {
      if (!txCharRef.current) {
        addLog('尚未連接藍牙', 'error');
        return;
      }
      try {
        addLog(`> ${msg}`);
        const CHUNK = 18;
        for (let i = 0; i < msg.length; i += CHUNK) {
          const chunk = msg.slice(i, i + CHUNK);
          const data = new TextEncoder().encode(chunk);
          await txCharRef.current.writeValue(data);
          await new Promise(r => setTimeout(r, 60)); // prevent overflow
        }
        await txCharRef.current.writeValue(new TextEncoder().encode('END'));
      } catch (e) {
        addLog(`傳送失敗: ${e.message}`, 'error');
      }
    });
  }, [addLog]);

  const handleCharacteristicValueChanged = (event) => {
    const val = new TextDecoder().decode(event.target.value);
    addLog(`< ${val}`, 'success');

    if (val.startsWith('WIFI:CFG:')) {
      const p = val.slice(9).split(',');
      setWifiStatus({
        ssid: p[0] || '',
        connected: p[1] === '1',
        ip: p[2] || ''
      });
    } else if (val.startsWith('WIFI:SSIDS:')) {
      const names = val.slice(11).split(',').filter(n => n.trim());
      setWifiList(names);
      setMessages(m => ({ ...m, wifi: `✅ 掃描完成，找到 ${names.length} 個網路` }));
    } else if (val.startsWith('SUCCESS:')) {
      setMessages(m => ({ ...m, wifi: '✅ 已連線 IP: ' + val.slice(8) }));
      send('WIFI:GET');
    } else if (val.startsWith('MSG:')) {
      setMessages(m => ({ ...m, wifi: val.slice(4) }));
    } else if (val.startsWith('ERR:')) {
      setMessages(m => ({ ...m, wifi: '❌ ' + val.slice(4) }));
    } else if (val.startsWith('MQTT:CFG:')) {
      const p = val.slice(9).split(',');
      if (p.length >= 5) {
        setMqttStatus({
          broker: p[0] || '',
          port: p[1] || '1883',
          topic: p[2] || '',
          enabled: p[3] === '1',
          connected: p[4] === '1',
          user: p.length >= 13 ? (p[11] || '') : '',
          pw: p.length >= 13 ? (p[12] || '') : '',
        });
      }
    } else if (val === 'MQTT:SET:OK') {
      setMessages(m => ({ ...m, mqtt: '✅ MQTT 設定已儲存' }));
      setTimeout(() => send('MQTT:GET'), 500);
    } else if (val.startsWith('MQTT:EN:')) {
      const enabled = val.slice(8) === '1';
      setMqttStatus(prev => ({ ...prev, enabled }));
      setMessages(m => ({ ...m, mqtt: enabled ? '✅ MQTT 已啟用' : '⏹ MQTT 已停用' }));
    } else if (val.startsWith('DATA:LIVE:')) {
      const raw = val.slice(10);
      if (raw) {
        try {
          const js = raw.indexOf('{');
          const je = raw.lastIndexOf('}');
          if (js >= 0 && je > js) {
            const parsed = JSON.parse(raw.substring(js, je + 1));
            setLiveData(prev => [parsed, ...prev].slice(0, 10)); // keep last 10
          }
        } catch (e) {}
      }
    }
  };

  const connect = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [UART_SERV] }]
      });
      deviceRef.current = device;
      
      device.addEventListener('gattserverdisconnected', () => {
        setDeviceInfo({ name: null, connected: false });
        txCharRef.current = null;
        rxCharRef.current = null;
        addLog('藍牙已斷線', 'error');
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(UART_SERV);
      
      txCharRef.current = await service.getCharacteristic(UUID_TX); // write to device
      const rxChar = await service.getCharacteristic(UUID_RX); // read from device
      rxCharRef.current = rxChar;
      
      await rxChar.startNotifications();
      rxChar.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      setDeviceInfo({ name: device.name, connected: true });
      addLog(`連線成功: ${device.name}`, 'success');

      // Auto load initial config
      setTimeout(() => {
        send('WIFI:GET');
        setTimeout(() => send('MQTT:GET'), 300);
      }, 500);

    } catch (e) {
      console.error(e);
      addLog(`配對失敗: ${e.message}`, 'error');
    }
  };

  const disconnect = () => {
    if (deviceRef.current && deviceRef.current.gatt.connected) {
      deviceRef.current.gatt.disconnect();
    }
  };

  const clearMessages = () => setMessages({ wifi: '', mqtt: '', lora: '' });

  return {
    connect,
    disconnect,
    send,
    deviceInfo,
    wifiStatus,
    wifiList,
    mqttStatus,
    messages,
    setMessages,
    liveData,
    logs,
    clearMessages
  };
}
