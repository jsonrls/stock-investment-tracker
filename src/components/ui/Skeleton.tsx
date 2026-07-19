'use client';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`skel ${className}`} style={style} />;
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 14px' }}>
          <span className="skel" style={{ display: 'block', height: 14, width: i === 0 ? 40 : i === 1 ? 120 : 70 }} />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="skel" style={{ display: 'block', height: 20, width: 120 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4].map(i => <span key={i} className="skel" style={{ display: 'block', height: 28, width: 36, borderRadius: 8 }} />)}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 8px' }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="skel" style={{ display: 'block', flex: 1, height: `${20 + Math.random() * 60}%`, borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
