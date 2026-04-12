// ============================================
// 4Scalping — App Controller
// ============================================

(async () => {

    // ---- State ----
    let currentCoin = 'BTC';
    let priceTimer = null;
    let _lastSignal = null;

    window._lastIndicators = {};

    // ---- Bootstrap Settings ----
    Settings.load();
    Settings.apply();

    // ---- Coin Tab Switching ----
    document.getElementById('coinTabs').addEventListener('click', e => {
        const tab = e.target.closest('.coin-tab');
        if (!tab) return;
        document.querySelectorAll('.coin-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCoin = tab.dataset.coin;
        loadCoin(currentCoin);
        // Grafik açıksa güncelle
        Chart.updateCoin(currentCoin);
        // Pred title güncelle
        _updatePredTitle();
    });

    // ---- Settings Buttons ----
    document.getElementById('settingsBtn')?.addEventListener('click', () => UI.openSettings());
    document.getElementById('navSettings')?.addEventListener('click', () => UI.openSettings());

    // ---- Chart Buttons ----
    document.getElementById('chartHeaderBtn')?.addEventListener('click', () => Chart.open(currentCoin));
    document.getElementById('chartCloseBtn')?.addEventListener('click', () => Chart.close());

    // Delegate ind-card chart button clicks
    document.getElementById('indicatorsGrid')?.addEventListener('click', e => {
        if (e.target.closest('.ind-card-chart-btn')) {
            Chart.open(currentCoin);
        }
    });

    // Interval buttons
    document.querySelectorAll('.chart-interval-btn').forEach(btn => {
        btn.addEventListener('click', () => Chart.changeInterval(btn.dataset.interval));
    });

    // ---- Refresh Prediction Button ----
    document.getElementById('refreshPredBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('refreshPredBtn');
        btn.classList.add('spinning');
        await runPrediction();
        btn.classList.remove('spinning');
    });

    // ---- Settings Change Callback ----
    UI.bindSettingsEvents((key, val) => {
        if (['predictionInterval', 'priceRefreshRate'].includes(key) || key === 'reset') {
            stopTimers();
            startPriceRefresh();
            startPredictionCycle();
        }
        if (['rsiPeriod', 'rsiOverbought', 'rsiOversold', 'macdFast', 'macdSlow', 'bbPeriod', 'klineLimit'].includes(key) || key === 'reset') {
            runPrediction();
        }
        _updatePredTitle();
    });

    // ---- Prediction Title (shows interval) ----
    function _updatePredTitle() {
        const secs = Settings.get('predictionInterval');
        const label = secs < 60 ? `${secs}s` : `${secs / 60}dk`;
        const el = document.getElementById('predTitle');
        if (el) el.textContent = `⏱ ${currentCoin} · ${label} Tahmini`;
    }

    // ---- Main Loader ----
    async function loadCoin(coinKey) {
        const sym = CONFIG.COINS[coinKey].symbol;
        try {
            const [ticker, klines] = await Promise.all([
                API.getTickerPrice(sym),
                API.getKlines(sym),
            ]);

            UI.updatePriceHero(coinKey, coinKey, ticker);
            UI.drawSparkline(klines);

            const ind = Indicators.calculate(klines);
            window._lastIndicators = ind;

            const result = Predictor.score(ind, klines);
            UI.updatePrediction(result, ticker.price, coinKey);
            UI.updateLSPanel(result);
            UI.updateIndicatorsGrid(ind, coinKey);

        } catch (err) {
            console.error('Veri yükleme hatası:', err);
        }
    }

    // ---- Live Price Refresh ----
    function startPriceRefresh() {
        clearInterval(priceTimer);
        priceTimer = setInterval(async () => {
            try {
                const sym = CONFIG.COINS[currentCoin].symbol;
                const price = await API.getCurrentPrice(sym);
                const dec = CONFIG.COINS[currentCoin].decimals;
                document.getElementById('currentPrice').textContent = '$' + UI.fmt(price, dec);
            } catch (_) { }
        }, CONFIG.PRICE_REFRESH_MS);
    }

    // ---- 1-Minute Prediction Cycle ----
    function startPredictionCycle() {
        runPrediction();
        const secs = Math.floor(CONFIG.PREDICTION_INTERVAL_MS / 1000);
        UI.startTimer(secs, null, () => {
            startPredictionCycle();
        });
    }

    function stopTimers() {
        clearInterval(priceTimer);
    }

    // Global expose → Refresh button can call directly
    window.runPrediction = runPrediction;

    async function runPrediction() {
        const coinKey = currentCoin;
        const sym = CONFIG.COINS[coinKey].symbol;
        try {
            const [ticker, klines] = await Promise.all([
                API.getTickerPrice(sym),
                API.getKlines(sym),
            ]);
            const ind = Indicators.calculate(klines);
            window._lastIndicators = ind;
            const result = Predictor.score(ind, klines);
            const predP = Predictor.predictPrice(ticker.price, result.direction, ind);

            // Güven filtresi
            const minConf = Settings.get('confidenceFilter') / 100;
            if (result.confidence >= minConf) {
                UI.updatePrediction(result, ticker.price, coinKey);
                UI.updateLSPanel(result);
                UI.updateIndicatorsGrid(ind, coinKey);
                UI.addHistoryItem(coinKey, result.direction, predP, CONFIG.COINS[coinKey].decimals);

                // Bildirim
                if (Settings.get('notifications') && _lastSignal && _lastSignal !== result.direction) {
                    try {
                        new Notification(`⚡ 4Scalping — ${coinKey}`, {
                            body: `Sinyal değişti: ${_lastSignal} → ${result.direction}`,
                            icon: '/icons/icon-192.png',
                        });
                    } catch (_) { }
                }
                _lastSignal = result.direction;
            }

        } catch (err) {
            console.error('Tahmin hatası:', err);
        }
    }

    // ---- Boot ----
    async function boot() {
        await new Promise(r => setTimeout(r, 2200));
        await loadCoin(currentCoin);
        _updatePredTitle();
        UI.hideSplash();
        startPriceRefresh();
        startPredictionCycle();
    }

    boot();

})();
