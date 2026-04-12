// ============================================
// 4Scalping — Binance API Layer
// ============================================

const API = (() => {

    /**
     * Belirtilen symbol için güncel fiyat ve 24s değişimi döner.
     * @returns { price, change24h, changePercent24h }
     */
    async function getTickerPrice(symbol) {
        const [tickerRes, priceRes] = await Promise.all([
            fetch(`${CONFIG.BINANCE_REST}/ticker/24hr?symbol=${symbol}`),
            fetch(`${CONFIG.BINANCE_REST}/ticker/price?symbol=${symbol}`),
        ]);
        if (!tickerRes.ok || !priceRes.ok) throw new Error('API hatası');
        const ticker = await tickerRes.json();
        const latest = await priceRes.json();
        return {
            price: parseFloat(latest.price),
            change24h: parseFloat(ticker.priceChange),
            changePercent24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            volume24h: parseFloat(ticker.volume),
        };
    }

    /**
     * 1m kline (mum) verisi çeker.
     * @returns Array<{ open,high,low,close,volume,time }>
     */
    async function getKlines(symbol, limit = CONFIG.KLINE_LIMIT) {
        const res = await fetch(
            `${CONFIG.BINANCE_REST}/klines?symbol=${symbol}&interval=${CONFIG.KLINE_INTERVAL}&limit=${limit}`
        );
        if (!res.ok) throw new Error('Kline API hatası');
        const raw = await res.json();
        return raw.map(k => ({
            time: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
        }));
    }

    /**
     * Anlık fiyat (lightweight).
     */
    async function getCurrentPrice(symbol) {
        const res = await fetch(`${CONFIG.BINANCE_REST}/ticker/price?symbol=${symbol}`);
        if (!res.ok) throw new Error('Fiyat API hatası');
        const data = await res.json();
        return parseFloat(data.price);
    }

    return { getTickerPrice, getKlines, getCurrentPrice };
})();
