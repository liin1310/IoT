import React, { useEffect, useRef } from 'react';
import BarChart from './BarChart';
import { GAS_LEVELS } from '../constants/gasLevels';

export default function GasChart({ points = [] }) {
  const latest = points.at(-1)?.value ?? 0;
  const audioRef = useRef(null);
  const prevDangerRef = useRef(false);

  const status =
    latest > GAS_LEVELS.DANGER
      ? 'DANGER'
      : latest > GAS_LEVELS.WARNING
      ? 'WARNING'
      : 'SAFE';

  const statusText = {
    SAFE: 'AN TOÀN',
    WARNING: 'CẢNH BÁO',
    DANGER: 'NGUY HIỂM'
  };

  const statusColor = {
    SAFE: '#3fb950',
    WARNING: '#f2cc60',
    DANGER: '#ff4d4f'
  };

  // 🔊 CẢNH BÁO ÂM THANH
  useEffect(() => {
    if (status === 'DANGER' && !prevDangerRef.current) {
      audioRef.current?.play().catch(() => {});
      prevDangerRef.current = true;
    }

    if (status !== 'DANGER') {
      prevDangerRef.current = false;
    }
  }, [status]);

  return (
    <div>
      {/* Âm thanh cảnh báo */}
      <audio
        ref={audioRef}
        src="/alarm.mp3"   // ⬅️ bạn chỉ cần đặt file này trong public/
        preload="auto"
      />

      {/* HEADER */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, opacity: 0.7 }}>Nồng độ khí Gas</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>
          {latest} ppm
          <span
            style={{
              marginLeft: 12,
              color: statusColor[status],
              fontSize: 16
            }}
          >
            {statusText[status]}
          </span>
        </div>
      </div>

      {/* NGƯỠNG */}
      <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 8 }}>
        <span style={{ color: '#3fb950' }}>🟢 &lt; {GAS_LEVELS.SAFE}</span>
        <span style={{ color: '#f2cc60' }}>🟡 {GAS_LEVELS.SAFE}–{GAS_LEVELS.WARNING}</span>
        <span style={{ color: '#ff4d4f' }}>🔴 &gt; {GAS_LEVELS.DANGER}</span>
      </div>

      {/* BIỂU ĐỒ */}
      <BarChart
        points={points.slice(-15)}
        height={120}
        colorFn={(v) =>
          v > GAS_LEVELS.DANGER
            ? '#ff4d4f'
            : v > GAS_LEVELS.WARNING
            ? '#f2cc60'
            : '#3fb950'
        }
      />
    </div>
  );
}
