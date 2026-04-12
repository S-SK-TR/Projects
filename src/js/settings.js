// ============================================
// 4Scalping — Settings Manager
// ============================================

const Settings = (() => {

    const LS_KEY = '4scalping_settings';

    // ---------- Defaults ----------
    const DEFAULTS = {
        // Tahmin & Güncelleme
        predictionInterval: 60,     // saniye
        priceRefreshRate: 5,      // saniye
        klineLimit: 60,     // mum sayısı

        // Gösterge Parametreleri
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        macdFast: 12,
        macdSlow: 26,
        bbPeriod: 20,

        // Bildirimler & Görünüm
        notifications: false,
        confidenceFilter: 0,      // minimum güven filtresi (0-60)
        currency: 'USDT', // USDT | TRY
    };

    let _current = null;

    // ---------- Load ----------
    function load() {
        try {
            const stored = localStorage.getItem(LS_KEY);
            _current = stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
        } catch (_) {
            _current = { ...DEFAULTS };
        }
        return _current;
    }

    // ---------- Get ----------
    function get(key) {
        if (!_current) load();
        return _current[key] ?? DEFAULTS[key];
    }

    // ---------- Save single ----------
    function save(key, val) {
        if (!_current) load();
        _current[key] = val;
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(_current));
        } catch (_) { }
    }

    // ---------- Reset ----------
    function reset() {
        _current = { ...DEFAULTS };
        try {
            localStorage.removeItem(LS_KEY);
        } catch (_) { }
        apply();
    }

    // ---------- Apply to CONFIG ----------
    function apply() {
        if (!_current) load();

        // Zamanlama
        CONFIG.PREDICTION_INTERVAL_MS = _current.predictionInterval * 1000;
        CONFIG.PRICE_REFRESH_MS = _current.priceRefreshRate * 1000;
        CONFIG.KLINE_LIMIT = _current.klineLimit;

        // Gösterge eşikleri
        CONFIG.RSI.PERIOD = _current.rsiPeriod;
        CONFIG.RSI.OVERBOUGHT = _current.rsiOverbought;
        CONFIG.RSI.OVERSOLD = _current.rsiOversold;
        CONFIG.MACD_FAST = _current.macdFast;
        CONFIG.MACD_SLOW = _current.macdSlow;
        CONFIG.BB_PERIOD = _current.bbPeriod;
    }

    // ---------- Populate UI ----------
    function populateUI() {
        if (!_current) load();
        const ids = {
            's-pred-interval': 'predictionInterval',
            's-price-refresh': 'priceRefreshRate',
            's-kline-limit': 'klineLimit',
            's-rsi-period': 'rsiPeriod',
            's-rsi-ob': 'rsiOverbought',
            's-rsi-os': 'rsiOversold',
            's-macd-fast': 'macdFast',
            's-macd-slow': 'macdSlow',
            's-bb-period': 'bbPeriod',
            's-confidence': 'confidenceFilter',
            's-currency': 'currency',
        };
        Object.entries(ids).forEach(([elId, key]) => {
            const el = document.getElementById(elId);
            if (!el) return;
            el.value = _current[key];
            // Slider label updates
            const label = document.getElementById(elId + '-val');
            if (label) label.textContent = el.value + (el.dataset.unit || '');
        });
        // Toggle
        const notifEl = document.getElementById('s-notifications');
        if (notifEl) notifEl.checked = _current.notifications;
    }

    return { load, get, save, reset, apply, populateUI, DEFAULTS };

})();
