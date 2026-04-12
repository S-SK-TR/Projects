// ============================================
// 4Scalping — UI Renderer
// ============================================

const UI = (() => {

    // ---------- Yardımcı ----------
    function fmt(price, decimals) {
        return price.toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    function pct(val) {
        const sign = val >= 0 ? '+' : '';
        return `${sign}${val.toFixed(2)}%`;
    }

    // ---------- Splash ----------
    function hideSplash() {
        const splash = document.getElementById('splash');
        const app = document.getElementById('app');
        splash.classList.add('hidden');
        app.classList.remove('hidden');
    }

    // ---------- Fiyat Hero ----------
    function updatePriceHero(coin, coinKey, ticker) {
        const decimals = CONFIG.COINS[coinKey].decimals;
        document.getElementById('coinBigIcon').textContent = CONFIG.COINS[coinKey].icon;
        document.getElementById('coinName').textContent = CONFIG.COINS[coinKey].name;
        document.getElementById('coinPair').textContent = `${coinKey} / USDT`;
        document.getElementById('currentPrice').textContent = '$' + fmt(ticker.price, decimals);
        const chEl = document.getElementById('priceChange');
        chEl.textContent = pct(ticker.changePercent24h);
        chEl.className = 'price-change ' + (ticker.changePercent24h >= 0 ? 'up' : 'down');
    }

    // ---------- Sparkline Canvas ----------
    function drawSparkline(klines) {
        const canvas = document.getElementById('sparklineCanvas');
        const ctx = canvas.getContext('2d');
        const closes = klines.map(k => k.close);
        const w = canvas.width, h = canvas.height;
        const pad = 4;
        const minV = Math.min(...closes);
        const maxV = Math.max(...closes);
        const range = maxV - minV || 1;

        ctx.clearRect(0, 0, w, h);

        const points = closes.map((v, i) => ({
            x: pad + (i / (closes.length - 1)) * (w - pad * 2),
            y: h - pad - ((v - minV) / range) * (h - pad * 2),
        }));

        // Gradient fill
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(99,179,237,0.3)');
        grad.addColorStop(1, 'rgba(99,179,237,0)');

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const cp = { x: (points[i - 1].x + points[i].x) / 2, y: (points[i - 1].y + points[i].y) / 2 };
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, cp.x, cp.y);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x, h);
        ctx.lineTo(points[0].x, h);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const cp = { x: (points[i - 1].x + points[i].x) / 2, y: (points[i - 1].y + points[i].y) / 2 };
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, cp.x, cp.y);
        }
        ctx.strokeStyle = '#63b3ed';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // ---------- Prediction Card ----------
    function updatePrediction(result, currentPrice, coinKey) {
        const dec = CONFIG.COINS[coinKey].decimals;
        const { direction, confidence, longScore, shortScore } = result;

        // Badge
        const badge = document.getElementById('signalBadge');
        badge.className = 'signal-badge';
        if (direction === 'LONG') {
            badge.classList.add('long');
            document.getElementById('signalArrow').textContent = '▲';
        } else if (direction === 'SHORT') {
            badge.classList.add('short');
            document.getElementById('signalArrow').textContent = '▼';
        } else {
            badge.classList.add('neutral');
            document.getElementById('signalArrow').textContent = '◆';
        }
        document.getElementById('signalText').textContent = direction;

        // Confidence bar
        const confPct = Math.round(confidence * 100);
        document.getElementById('confBar').style.width = confPct + '%';
        document.getElementById('confLabel').textContent = `Güven: ${confPct}%`;

        // Predicted price
        const predP = Predictor.predictPrice(currentPrice, direction, window._lastIndicators || {});
        const delta = predP - currentPrice;
        const deltaPct = (delta / currentPrice) * 100;

        document.getElementById('predPrice').textContent = '$' + fmt(predP, dec);
        const deltaEl = document.getElementById('predDelta');
        deltaEl.textContent = (delta >= 0 ? '+' : '') + fmt(delta, dec) + ` (${pct(deltaPct)})`;
        deltaEl.className = 'pred-price-delta ' + (delta >= 0 ? 'up' : 'down');
    }

    // ---------- Long/Short Panel ----------
    function updateLSPanel(result) {
        document.getElementById('longScore').textContent = result.longScore;
        document.getElementById('shortScore').textContent = result.shortScore;

        const longInd = result.signals.filter(s => s.dir === 'bull');
        const shortInd = result.signals.filter(s => s.dir === 'bear');

        const renderItems = (signals, elId) => {
            const el = document.getElementById(elId);
            el.innerHTML = signals.slice(0, 3).map(s => `
        <div class="ls-ind-item">
          <span class="ls-ind-label">${s.name}</span>
          <span class="ls-ind-val bull">${s.label}</span>
        </div>
      `).join('');
        };
        renderItems(longInd, 'longIndicators');
        const shortEl = document.getElementById('shortIndicators');
        shortEl.innerHTML = shortInd.slice(0, 3).map(s => `
      <div class="ls-ind-item">
        <span class="ls-ind-label">${s.name}</span>
        <span class="ls-ind-val bear">${s.label}</span>
      </div>
    `).join('');
    }

    // ---------- Indicators Grid ----------
    function updateIndicatorsGrid(ind, coinKey) {
        const dec = CONFIG.COINS[coinKey].decimals;
        const grid = document.getElementById('indicatorsGrid');

        const items = [];

        if (ind.rsi !== null) {
            const r = ind.rsi;
            const dir = r < 30 ? 'bull' : r > 70 ? 'bear' : 'neutral';
            const sig = r < 30 ? 'AŞIRI SATIM' : r > 70 ? 'AŞIRI ALIM' : 'NÖTR';
            items.push({ name: 'RSI (14)', val: r.toFixed(2), dir, sig });
        }

        if (ind.macd) {
            const h = ind.macd.histogram;
            const dir = h > 0 ? 'bull' : 'bear';
            const sig = h > 0 ? 'YÜKSELİŞ' : 'DÜŞÜŞ';
            items.push({ name: 'MACD Hist', val: h.toFixed(5), dir, sig });
        }

        if (ind.bb) {
            const { upper, lower, middle } = ind.bb;
            items.push({ name: 'BB Üst', val: '$' + fmt(upper, dec), dir: 'neutral', sig: 'DİRENÇ' });
            items.push({ name: 'BB Alt', val: '$' + fmt(lower, dec), dir: 'neutral', sig: 'DESTEK' });
        }

        if (ind.stoch) {
            const k = ind.stoch.k;
            const dir = k < 20 ? 'bull' : k > 80 ? 'bear' : 'neutral';
            const sig = k < 20 ? 'AŞIRI SATIM' : k > 80 ? 'AŞIRI ALIM' : 'NÖTR';
            items.push({ name: 'Stoch %K', val: k.toFixed(1), dir, sig });
        }

        if (ind.emaTrend) {
            const { ema9, ema21, cross } = ind.emaTrend;
            const dir = cross === 'golden' ? 'bull' : 'bear';
            items.push({ name: 'EMA 9', val: '$' + fmt(ema9, dec), dir, sig: cross === 'golden' ? 'YUKARI' : 'AŞAĞI' });
            items.push({ name: 'EMA 21', val: '$' + fmt(ema21, dec), dir: 'neutral', sig: '—' });
        }

        if (ind.atr) {
            items.push({ name: 'ATR', val: fmt(ind.atr, dec), dir: 'neutral', sig: 'VOLATİLİTE' });
        }

        if (ind.volTrend) {
            const r = ind.volTrend.ratio;
            const dir = r > 0.55 ? 'bull' : r < 0.45 ? 'bear' : 'neutral';
            items.push({ name: 'Vol Oran', val: (r * 100).toFixed(0) + '%', dir, sig: dir === 'bull' ? 'ALICI' : dir === 'bear' ? 'SATICI' : 'DENGELI' });
        }

        grid.innerHTML = items.map(it => `
      <div class="ind-card ${it.dir}">
        <div class="ind-card-name-row">
          <div class="ind-card-name">${it.name}</div>
          <button class="ind-card-chart-btn" title="Grafik Aç">📈</button>
        </div>
        <div class="ind-card-val">${it.val}</div>
        <div class="ind-card-sig ${it.dir}">${it.sig}</div>
      </div>
    `).join('');
    }

    // ---------- Countdown Timer ----------
    let _timerInterval = null;
    function startTimer(seconds, onTick, onDone) {
        clearInterval(_timerInterval);
        let s = seconds;
        document.getElementById('predTimer').textContent = s + 's';
        _timerInterval = setInterval(() => {
            s--;
            document.getElementById('predTimer').textContent = s + 's';
            if (onTick) onTick(s);
            if (s <= 0) {
                clearInterval(_timerInterval);
                if (onDone) onDone();
            }
        }, 1000);
    }

    // ---------- History ----------
    function addHistoryItem(coinKey, direction, predictedPrice, decimals) {
        const list = document.getElementById('historyList');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const item = document.createElement('div');
        item.className = 'hist-item';
        item.innerHTML = `
      <div class="hist-badge ${direction.toLowerCase()}">${direction}</div>
      <div class="hist-info">
        <div class="hist-coin">${coinKey}/USDT</div>
        <div class="hist-time">${timeStr}</div>
      </div>
      <div class="hist-result">
        <div class="hist-price">$${fmt(predictedPrice, decimals)}</div>
        <div class="hist-acc pending">Bekleniyor…</div>
      </div>
    `;
        list.prepend(item);
        // Max kayıt
        while (list.children.length > CONFIG.HISTORY_LIMIT) {
            list.removeChild(list.lastChild);
        }
    }

    // ---------- Settings Panel ----------
    function openSettings() {
        Settings.populateUI();
        const overlay = document.getElementById('settingsOverlay');
        const sheet = document.getElementById('settingsSheet');
        overlay.classList.remove('hidden');
        sheet.classList.remove('hidden');
        // Force reflow for transition
        overlay.offsetHeight;
        overlay.classList.add('visible');
        sheet.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeSettings() {
        const overlay = document.getElementById('settingsOverlay');
        const sheet = document.getElementById('settingsSheet');
        overlay.classList.remove('visible');
        sheet.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => {
            overlay.classList.add('hidden');
            sheet.classList.add('hidden');
        }, 380);
    }

    // Wire all settings inputs after DOM is ready
    function bindSettingsEvents(onSettingChanged) {
        // Select inputs
        const selects = {
            's-pred-interval': 'predictionInterval',
            's-price-refresh': 'priceRefreshRate',
            's-kline-limit': 'klineLimit',
            's-rsi-period': 'rsiPeriod',
            's-macd-fast': 'macdFast',
            's-macd-slow': 'macdSlow',
            's-bb-period': 'bbPeriod',
            's-currency': 'currency',
        };
        Object.entries(selects).forEach(([elId, key]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.addEventListener('change', () => {
                const val = isNaN(el.value) ? el.value : Number(el.value);
                Settings.save(key, val);
                Settings.apply();
                if (onSettingChanged) onSettingChanged(key, val);
            });
        });

        // Range sliders
        const ranges = {
            's-rsi-ob': ['rsiOverbought', 's-rsi-ob-val', ''],
            's-rsi-os': ['rsiOversold', 's-rsi-os-val', ''],
            's-confidence': ['confidenceFilter', 's-confidence-val', '%'],
        };
        Object.entries(ranges).forEach(([elId, [key, labelId, unit]]) => {
            const el = document.getElementById(elId);
            const label = document.getElementById(labelId);
            if (!el) return;
            el.addEventListener('input', () => {
                if (label) label.textContent = el.value + unit;
            });
            el.addEventListener('change', () => {
                Settings.save(key, Number(el.value));
                Settings.apply();
                if (onSettingChanged) onSettingChanged(key, Number(el.value));
            });
        });

        // Notifications toggle
        const notifEl = document.getElementById('s-notifications');
        if (notifEl) {
            notifEl.addEventListener('change', async () => {
                if (notifEl.checked) {
                    const perm = await Notification.requestPermission();
                    if (perm !== 'granted') { notifEl.checked = false; return; }
                }
                Settings.save('notifications', notifEl.checked);
            });
        }

        // Close button
        document.getElementById('settingsClose')?.addEventListener('click', closeSettings);
        // Overlay click to close
        document.getElementById('settingsOverlay')?.addEventListener('click', closeSettings);
        // Reset button
        document.getElementById('settingsReset')?.addEventListener('click', () => {
            Settings.reset();
            Settings.populateUI();
            if (onSettingChanged) onSettingChanged('reset', null);
        });
    }

    return { hideSplash, updatePriceHero, drawSparkline, updatePrediction, updateLSPanel, updateIndicatorsGrid, startTimer, addHistoryItem, fmt, openSettings, closeSettings, bindSettingsEvents };
})();
