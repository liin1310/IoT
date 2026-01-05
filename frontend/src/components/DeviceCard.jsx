import React from 'react';

function getDeviceIcon(device) {
  switch (device.type) {
    case 'light':
      return '💡';
    case 'fan':
      return '🌀';
    case 'door':
      return device.state === 'ON' ? '🚪' : '🔒';
    default:
      return '🔌';
  }
}

export default function DeviceCard({ device, onToggle }) {
  const isOn = device.state === 'ON';

  const bgStyle = device.image
    ? { backgroundImage: `url(${device.image})` }
    : {
        background: isOn
          ? 'linear-gradient(180deg,#0b3b50,#071726)'
          : 'linear-gradient(180deg,#1b2530,#071726)'
      };

  return (
    <div className="device-card-v2" style={{ margin: 12 }}>
      <div className="bg" style={bgStyle} />

      <div className="overlay">
        <div className="top">
          {/* ICON */}
          <div
            style={{
              width: 44,
              height: 44,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22
            }}
          >
            {getDeviceIcon(device)}
          </div>

          {/* TOGGLE */}
          <button
            onClick={() => onToggle(device)}
            style={{
              padding: '6px 12px',
              borderRadius: 18,
              border: 'none',
              background: isOn ? '#0bbf7b' : 'rgba(255,255,255,0.12)',
              color: isOn ? '#012' : '#fff'
            }}
          >
            {isOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div>
          <div className="status">
            {isOn ? `ON • ${device.level ?? ''}` : 'OFF'}
          </div>
          <div className="name">{device.name}</div>
        </div>
      </div>
    </div>
  );
}
