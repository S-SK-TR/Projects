// ============================================
// 4Scalping — Chart Module (TradingView Lightweight Charts)
// ============================================

const Chart = (() => {

    let _chart = null;
    let _candleSeries = null;
    let _volumeSeries = null;
    let _currentCoin = null;
    let _currentInterval = '1m';
    let _liveTimer = null;
    let _resizeObserver = null;

    // ---------- Open ----------
    async function open(coinKey, interval) {
        _currentCoin = coinKey;
        _currentInterval = interval || '1m';

        // Modal göster
        const modal = document.getElementById('chartModal');
        modal.classList.remove('hidden');
        modal.offsetHeight; // reflow
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';

        // Başlık
        const coin = CONFIG.COINS[coinKey];
        document.getElementById('chartCoinName').textContent = `${coin.icon} ${coinKey} / USDT`;

        // Interval highlight
        _highlightInterval(_currentInterval);

        await _render(coinKey, _currentInterval);
        _startLive();
    }

    // ---------- Close ----------
    function close() {
        const modal = document.getElementById('chartModal');
        modal.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(() => {
            modal.classList.add('hidden');
            _destroyChart();
        }, 350);
        _stopLive();
    }

    // ---------- Set Interval ----------
    async function changeInterval(interval) {
        _currentInterval = interval;
        _highlightInterval(interval);
        _stopLive();
        await _render(_currentCoin, interval);
        _startLive();
    }

    // ---------- Update Coin (tab switch) ----------
    async function updateCoin(coinKey) {
        if (!_isOpen()) return;
        _currentCoin = coinKey;
        const coin = CONFIG.COINS[coinKey];
        document.getElementById('chartCoinName').textContent = `${coin.icon} ${coinKey} / USDT`;
        _stopLive();
        await _render(coinKey, _currentInterval);
        _startLive();
    }

    // ---------- Internals ----------
    function _isOpen() {
        const modal = document.getElementById('chartModal');
        return modal && modal.classList.contains('visible');
    }

    function _highlightInterval(iv) {
        document.querySelectorAll('.chart-interval-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.interval === iv);
        });
    }

    async function _render(coinKey, interval) {
        _destroyChart();
        const container = document.getElementById('chartContainer');
        container.innerHTML = `<div class="chart-loading">
      <div class="chart-loading-spinner"></div>
      <span>Grafik yükleniyor…</span>
    </div>`;

        // Veri çek
        const sym = CONFIG.COINS[coinKey].symbol;
        const limit = { '1m': 300, '5m': 200, '15m': 150, '1h': 120 }[interval] || 200;
        const res = await fetch(`${CONFIG.BINANCE_REST}/klines?symbol=${sym}&interval=${interval}&limit=${limit}`);
        const raw = await res.json();

        container.innerHTML = '';

        // Chart oluştur
        _chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { color: '#0d1117' },
                textColor: '#8b949e',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
            },
            grid: {
                vertLines: { color: 'rgba(255,255,255,0.04)' },
                horzLines: { color: 'rgba(255,255,255,0.04)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: { color: 'rgba(99,179,237,0.5)', width: 1, style: 1, labelBackgroundColor: '#1c2230' },
                horzLine: { color: 'rgba(99,179,237,0.5)', width: 1, style: 1, labelBackgroundColor: '#1c2230' },
            },
            rightPriceScale: { borderColor: 'rgba(255,255,255,0.07)' },
            timeScale: {
                borderColor: 'rgba(255,255,255,0.07)',
                timeVisible: true,
                secondsVisible: false,
                barSpacing: 6,
                rightOffset: 5,
            },
            handleScroll: { mouseWheel: true, pressedMouseMove: true },
            handleScale: { mouseWheel: true, pinch: true },
        });

        // Candlestick serisi
        _candleSeries = _chart.addCandlestickSeries({
            upColor: '#48bb78',
            downColor: '#fc8181',
            borderUpColor: '#48bb78',
            borderDownColor: '#fc8181',
            wickUpColor: '#48bb78',
            wickDownColor: '#fc8181',
        });

        // Hacim serisi
        _volumeSeries = _chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
            scaleMargins: { top: 0.82, bottom: 0 },
        });

        // Destek ve Direnç Serileri (BB Overlay)
        _resistSeries = _chart.addLineSeries({
            color: 'rgba(252, 129, 129, 0.7)',
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dotted,
            crosshairMarkerVisible: false,
            lastValueVisible: true,
            title: 'Direnç',
        });

        _supportSeries = _chart.addLineSeries({
            color: 'rgba(99, 179, 237, 0.7)',
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dotted,
            crosshairMarkerVisible: false,
            lastValueVisible: true,
            title: 'Destek',
        });

        const candles = raw.map(k => ({
            time: k[0] / 1000,
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
        }));

        const volumes = raw.map(k => ({
            time: k[0] / 1000,
            value: parseFloat(k[5]),
            color: parseFloat(k[4]) >= parseFloat(k[1])
                ? 'rgba(72,187,120,0.32)'
                : 'rgba(252,129,129,0.32)',
        }));

        // Tarihsel BB hesaplama
        const closesArray = raw.map(k => parseFloat(k[4]));
        const bbPeriod = Settings ? Settings.get('bbPeriod') : 20;
        const bb = Indicators.bbHistory(closesArray, bbPeriod, 2);

        const upperData = [];
        const lowerData = [];
        for (let i = 0; i < bb.upper.length; i++) {
            const kIdx = i + bbPeriod - 1;
            const t = raw[kIdx][0] / 1000;
            upperData.push({ time: t, value: bb.upper[i] });
            lowerData.push({ time: t, value: bb.lower[i] });
        }

        _candleSeries.setData(candles);
        _volumeSeries.setData(volumes);
        if (upperData.length) _resistSeries.setData(upperData);
        if (lowerData.length) _supportSeries.setData(lowerData);
        _chart.timeScale().fitContent();

        // Responsive resize
        _resizeObserver = new ResizeObserver(() => {
            if (_chart) _chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight,
            });
        });
        _resizeObserver.observe(container);
    }

    function _startLive() {
        _stopLive();
        const bbPeriod = Settings ? Settings.get('bbPeriod') : 20;

        _liveTimer = setInterval(async () => {
            if (!_currentCoin || !_candleSeries || !_isOpen()) return;
            try {
                const sym = CONFIG.COINS[_currentCoin].symbol;
                // BB de hesaplayabilmek için en az bbPeriod kadar mum çekmeliyiz
                const res = await fetch(
                    `${CONFIG.BINANCE_REST}/klines?symbol=${sym}&interval=${_currentInterval}&limit=${bbPeriod}`
                );
                const raw = await res.json();
                const last = raw[raw.length - 1];
                const open = parseFloat(last[1]);
                const close = parseFloat(last[4]);
                const time = last[0] / 1000;

                _candleSeries.update({
                    time,
                    open, high: parseFloat(last[2]),
                    low: parseFloat(last[3]),
                    close,
                });
                _volumeSeries.update({
                    time,
                    value: parseFloat(last[5]),
                    color: close >= open ? 'rgba(72,187,120,0.32)' : 'rgba(252,129,129,0.32)',
                });

                // Live BB Update
                const closes = raw.map(k => parseFloat(k[4]));
                const bbLive = Indicators.bbHistory(closes, bbPeriod, 2);
                if (bbLive.upper.length > 0) {
                    _resistSeries.update({ time, value: bbLive.upper[bbLive.upper.length - 1] });
                    _supportSeries.update({ time, value: bbLive.lower[bbLive.lower.length - 1] });
                }

            } catch (_) { }
        }, 5000);
    }

    function _stopLive() {
        clearInterval(_liveTimer);
        _liveTimer = null;
    }

    function _destroyChart() {
        if (_resizeObserver) { _resizeObserver.disconnect(); _resizeObserver = null; }
        if (_chart) {
            _chart.remove();
            _chart = null;
            _candleSeries = null;
            _volumeSeries = null;
            _resistSeries = null;
            _supportSeries = null;
        }
    }

    return { open, close, changeInterval, updateCoin };
})();
