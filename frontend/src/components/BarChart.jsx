export default function BarChart({ points, height = 120, colorFn }) {
  if (!points || points.length === 0) return <div style={{ height }} />;

  const values = points.map(p => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
      {points.map((p, i) => {
        const h =
          ((p.value - min) / (max - min || 1)) * (height - 20) + 8;

        return (
          <div
            key={i}
            title={`${p.value} ppm`}
            style={{
              width: 14,
              height: h,
              background: colorFn ? colorFn(p.value) : '#2f3b45',
              borderRadius: 6,
              transition: 'all 0.3s'
            }}
          />
        );
      })}
    </div>
  );
}
