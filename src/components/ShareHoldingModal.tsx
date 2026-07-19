'use client';

import { useState, useEffect, useRef } from 'react';
import { Share2, Download, X } from 'lucide-react';

interface ShareHoldingModalProps {
  holding: {
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice?: number;
    marketValue?: number;
    gainLoss?: number;
    gainLossPercent?: number;
    category: string;
  };
  onClose: () => void;
}

export function ShareHoldingModal({ holding, onClose }: ShareHoldingModalProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Preload background image based on holding performance
  useEffect(() => {
    const img = new Image();
    const isPositive = (holding.gainLoss ?? 0) >= 0;
    img.onload = () => {
      setBgImage(img);
    };
    img.onerror = () => {
      console.error('Failed to load local background image');
      setBgImage(null);
    };
    img.src = isPositive ? '/gain.png' : '/loss.png';
  }, [holding]);

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-res canvas dimensions
    canvas.width = 1200;
    canvas.height = 630;

    const renderOverlays = () => {
      // 1. Overlay a dark semi-transparent mask to ensure text readability
      ctx.fillStyle = 'rgba(10, 15, 30, 0.45)';
      ctx.fillRect(0, 0, 1200, 630);

      const isPositive = (holding.gainLoss ?? 0) >= 0;
      const hasProfit = (holding.gainLoss ?? 0) > 0;
      const hasLoss = (holding.gainLoss ?? 0) < 0;
      const themeColor = isPositive ? '#00d67a' : '#ff4757';

      // 2. Draw Category badge ABOVE the stock code
      const catText = holding.category.toUpperCase();
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      const badgeWidth = ctx.measureText(catText).width + 24;
      ctx.fillStyle = isPositive ? 'rgba(0, 214, 122, 0.15)' : 'rgba(255, 71, 87, 0.15)';
      ctx.strokeStyle = isPositive ? 'rgba(0, 214, 122, 0.4)' : 'rgba(255, 71, 87, 0.4)';
      ctx.lineWidth = 1.5;

      const rx = 80;
      const ry = 60;
      const rw = badgeWidth;
      const rh = 30;
      const radius = 6;

      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = themeColor;
      ctx.fillText(catText, rx + 12, ry + 20);

      // 3. Draw Symbol & Company Name BELOW the badge
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 76px system-ui, -apple-system, sans-serif';
      ctx.fillText(holding.symbol, 80, 175);

      // Company name
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '500 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(holding.name, 80, 230);

      const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

      // 4. Stats Grid
      const drawStat = (label: string, val: string, x: number, y: number) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.fillText(label.toUpperCase(), x, y);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
        ctx.fillText(val, x, y + 46);
      };

      if (holding.symbol === 'PORTFOLIO') {
        drawStat('active assets', `${holding.shares} Holdings`, 80, 310);
        drawStat('invested capital', `₱${fmt(holding.avgPrice)}`, 80, 440);
        drawStat('uninvested cash', `₱${holding.currentPrice ? fmt(holding.currentPrice) : '0.00'}`, 420, 440);
        drawStat('initial capital', `₱${holding.marketValue ? fmt(holding.marketValue) : '0.00'}`, 420, 310);
      } else {
        drawStat('shares held', holding.shares.toLocaleString(), 80, 310);
        drawStat('avg buy price', `₱${fmt(holding.avgPrice)}`, 80, 440);
        drawStat('current price', `₱${holding.currentPrice ? fmt(holding.currentPrice) : '—'}`, 420, 440);
        drawStat('market value', `₱${holding.marketValue ? fmt(holding.marketValue) : '—'}`, 420, 310);
      }

      // 5. Glow PNL panel on the right
      const px = 780;
      const py = 80;
      const pw = 340;
      const ph = 430;
      const pr = 20;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 40;

      ctx.beginPath();
      ctx.moveTo(px + pr, py);
      ctx.lineTo(px + pw - pr, py);
      ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr);
      ctx.lineTo(px + pw, py + ph - pr);
      ctx.quadraticCurveTo(px + pw, py + ph, px + pw - pr, py + ph);
      ctx.lineTo(px + pr, py + ph);
      ctx.quadraticCurveTo(px, py + ph, px, py + ph - pr);
      ctx.lineTo(px, py + pr);
      ctx.quadraticCurveTo(px, py, px + pr, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0; // reset shadow

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(holding.symbol === 'PORTFOLIO' ? 'NET PORTFOLIO RETURN' : 'NET PORTFOLIO RETURN', px + 36, py + 54);

      ctx.fillStyle = themeColor;
      ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
      const retText = `${isPositive ? '+' : ''}${(holding.gainLossPercent ?? 0).toFixed(2)}%`;
      ctx.fillText(retText, px + 36, py + 130);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(holding.symbol === 'PORTFOLIO' ? 'NET PORTFOLIO PNL' : 'NET PROFIT / LOSS', px + 36, py + 230);

      ctx.fillStyle = themeColor;
      ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
      const pnlValText = `${isPositive ? '+' : ''}₱${fmt(Math.abs(holding.gainLoss ?? 0))}`;
      ctx.fillText(pnlValText, px + 36, py + 296);

      // Show a performance status for any profit or loss, but not at break-even.
      if (hasProfit || hasLoss) {
        ctx.fillStyle = hasProfit ? 'rgba(0, 214, 122, 0.1)' : 'rgba(255, 71, 87, 0.1)';
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 1;
        const bY = py + 334;
        const bW = pw - 72;
        const bH = 44;
        const bR = 8;
        ctx.beginPath();
        ctx.moveTo(px + 36 + bR, bY);
        ctx.lineTo(px + 36 + bW - bR, bY);
        ctx.quadraticCurveTo(px + 36 + bW, bY, px + 36 + bW, bY + bR);
        ctx.lineTo(px + 36 + bW, bY + bH - bR);
        ctx.quadraticCurveTo(px + 36 + bW, bY + bH, px + 36 + bW - bR, bY + bH);
        ctx.lineTo(px + 36 + bR, bY + bH);
        ctx.quadraticCurveTo(px + 36, bY + bH, px + 36, bY + bH - bR);
        ctx.lineTo(px + 36, bY + bR);
        ctx.quadraticCurveTo(px + 36, bY, px + 36 + bR, bY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = themeColor;
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hasProfit ? 'OUTPERFORMING POSITION' : 'MARKET UNDERPERFORMANCE', px + pw/2, bY + 26);
        ctx.textAlign = 'left';
      }

      // 6. Watermarks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('PSE Portfolio Tracker 📈', 80, 566);

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(dateStr, 1120 - ctx.measureText(dateStr).width, 566);
    };

    const drawFallbackBg = () => {
      // Default clean dark blue linear gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 630);
      grad.addColorStop(0, '#0a0e1a');
      grad.addColorStop(0.5, '#121626');
      grad.addColorStop(1, '#080a12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      const isPositive = (holding.gainLoss ?? 0) >= 0;
      ctx.fillStyle = isPositive ? 'rgba(0, 214, 122, 0.05)' : 'rgba(255, 71, 87, 0.04)';
      ctx.beginPath();
      ctx.arc(1050, 180, 260, 0, Math.PI * 2);
      ctx.fill();
    };

    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, 1200, 630);
      renderOverlays();
    } else {
      drawFallbackBg();
      renderOverlays();
    }
  };

  useEffect(() => {
    drawCard();
  }, [bgImage, holding]);

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${holding.symbol}_PNL.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${holding.symbol} PNL Card`,
            text: `Check out my PNL card for ${holding.symbol}! Generated via PSE Portfolio Tracker.`
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('PNL Image copied to clipboard!');
        } catch (err) {
          handleDownload();
        }
      }
    }, 'image/png');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${holding.symbol}_PNL.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded PNL Card successfully!');
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="card slide-in modal-card" style={{ width: '100%', maxWidth: 740, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tp)' }}>Generate Performance Card</h2>
            <p style={{ fontSize: 12, color: 'var(--tm)', marginTop: 3 }}>
              Share your {holding.symbol === 'PORTFOLIO' ? 'overall Portfolio' : holding.symbol} PNL card with customized designs
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tm)', padding: 4, borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        {/* Card Canvas Preview */}
        <div style={{ position: 'relative', width: '100%', background: '#0e111a', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20 }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', display: 'block', height: 'auto', aspectRatio: '1200/630' }}
          />
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleDownload} className="btn-s" style={{ padding: '9px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <Download size={14} /> Download PNG
          </button>
          <button type="button" onClick={handleShare} className="btn-p" style={{ padding: '9px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <Share2 size={14} /> Share Card
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          color: 'var(--tp)', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span>📋</span> {toast}
        </div>
      )}
    </div>
  );
}
