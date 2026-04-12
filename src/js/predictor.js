// ============================================
// 4Scalping — Predictor (Skor + Tahmin Motoru)
// ============================================

const Predictor = (() => {

    /**
     * Tüm indikatörlere göre LONG / SHORT skoru hesaplar.
     * Her sinyal -2 … +2 arası puan katkısı sağlar.
     * Pozitif toplam → LONG, Negatif → SHORT.
     */
    function score(ind, klines) {
        let longScore = 0;
        let shortScore = 0;
        const signals = [];

        // --- RSI ---
        if (ind.rsi !== null) {
            const r = ind.rsi;
            if (r < CONFIG.RSI.OVERSOLD) {
                longScore += 2; signals.push({ name: 'RSI', val: r.toFixed(1), dir: 'bull', label: 'Aşırı Satım' });
            } else if (r > CONFIG.RSI.OVERBOUGHT) {
                shortScore += 2; signals.push({ name: 'RSI', val: r.toFixed(1), dir: 'bear', label: 'Aşırı Alım' });
            } else if (r < 50) {
                shortScore += 1; signals.push({ name: 'RSI', val: r.toFixed(1), dir: 'bear', label: 'Zayıf' });
            } else {
                longScore += 1; signals.push({ name: 'RSI', val: r.toFixed(1), dir: 'bull', label: 'Güçlü' });
            }
        }

        // --- MACD ---
        if (ind.macd) {
            const { histogram, macd: m, signal: s } = ind.macd;
            if (histogram > 0 && m > s) {
                longScore += 2; signals.push({ name: 'MACD', val: histogram.toFixed(4), dir: 'bull', label: 'Yükseliş' });
            } else if (histogram < 0 && m < s) {
                shortScore += 2; signals.push({ name: 'MACD', val: histogram.toFixed(4), dir: 'bear', label: 'Düşüş' });
            } else {
                signals.push({ name: 'MACD', val: histogram.toFixed(4), dir: 'neutral', label: 'Nötr' });
            }
        }

        // --- Bollinger Bands ---
        if (ind.bb) {
            const { pct } = ind.bb;
            if (pct < 0.15) {
                longScore += 2; signals.push({ name: 'BB', val: (pct * 100).toFixed(0) + '%', dir: 'bull', label: 'Alt Band' });
            } else if (pct > 0.85) {
                shortScore += 2; signals.push({ name: 'BB', val: (pct * 100).toFixed(0) + '%', dir: 'bear', label: 'Üst Band' });
            } else if (pct > 0.5) {
                longScore += 1; signals.push({ name: 'BB', val: (pct * 100).toFixed(0) + '%', dir: 'bull', label: 'Üst Yarı' });
            } else {
                shortScore += 1; signals.push({ name: 'BB', val: (pct * 100).toFixed(0) + '%', dir: 'bear', label: 'Alt Yarı' });
            }
        }

        // --- Stochastic ---
        if (ind.stoch) {
            const { k } = ind.stoch;
            if (k < 20) {
                longScore += 1.5; signals.push({ name: 'Stoch', val: k.toFixed(0), dir: 'bull', label: 'Aşırı Satım' });
            } else if (k > 80) {
                shortScore += 1.5; signals.push({ name: 'Stoch', val: k.toFixed(0), dir: 'bear', label: 'Aşırı Alım' });
            } else {
                signals.push({ name: 'Stoch', val: k.toFixed(0), dir: 'neutral', label: 'Nötr' });
            }
        }

        // --- EMA Trendi ---
        if (ind.emaTrend) {
            const { cross, above21 } = ind.emaTrend;
            if (cross === 'golden') {
                longScore += 2; signals.push({ name: 'EMA', val: '9/21', dir: 'bull', label: 'Altın Kesişim' });
            } else {
                shortScore += 2; signals.push({ name: 'EMA', val: '9/21', dir: 'bear', label: 'Ölüm Kesişimi' });
            }
            if (above21) {
                longScore += 1;
            } else {
                shortScore += 1;
            }
        }

        // --- Volume Trend ---
        if (ind.volTrend) {
            const { ratio } = ind.volTrend;
            if (ratio > 0.6) {
                longScore += 1.5; signals.push({ name: 'Vol', val: (ratio * 100).toFixed(0) + '%', dir: 'bull', label: 'Alıcı Baskısı' });
            } else if (ratio < 0.4) {
                shortScore += 1.5; signals.push({ name: 'Vol', val: (ratio * 100).toFixed(0) + '%', dir: 'bear', label: 'Satıcı Baskısı' });
            } else {
                signals.push({ name: 'Vol', val: (ratio * 100).toFixed(0) + '%', dir: 'neutral', label: 'Dengeli' });
            }
        }

        // --- Toplam skor normalize (0-100) ---
        const maxPossible = 13;  // tüm puanların toplamı
        const longPct = Math.min(100, Math.round((longScore / maxPossible) * 100));
        const shortPct = Math.min(100, Math.round((shortScore / maxPossible) * 100));

        const direction = longScore > shortScore ? 'LONG' : shortScore > longScore ? 'SHORT' : 'NÖTR';
        const confidence = Math.abs(longScore - shortScore) / maxPossible;  // 0-1

        return { longScore: longPct, shortScore: shortPct, direction, confidence, signals };
    }

    /**
     * Basit fiyat tahmini:
     * Son ATR ve yön bilgisiyle 1 dakika sonrası tahmin.
     */
    function predictPrice(currentPrice, direction, ind) {
        const atrVal = ind.atr || 0;
        const factor = direction === 'LONG' ? 1 : direction === 'SHORT' ? -1 : 0;
        const delta = atrVal * 0.3 * factor;   // ATR'nin %30'u kadar hareket tahmini
        return currentPrice + delta;
    }

    return { score, predictPrice };
})();
