// ============================================
// 4Scalping — Technical Indicators Engine
// ============================================

const Indicators = (() => {

    // ---------- Yardımcı ----------
    const closes = klines => klines.map(k => k.close);
    const highs = klines => klines.map(k => k.high);
    const lows = klines => klines.map(k => k.low);
    const volumes = klines => klines.map(k => k.volume);

    function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

    // SMA
    function sma(arr, period) {
        const result = [];
        for (let i = period - 1; i < arr.length; i++) {
            result.push(avg(arr.slice(i - period + 1, i + 1)));
        }
        return result;
    }

    // EMA
    function ema(arr, period) {
        const k = 2 / (period + 1);
        const result = [avg(arr.slice(0, period))];
        for (let i = period; i < arr.length; i++) {
            result.push(arr[i] * k + result[result.length - 1] * (1 - k));
        }
        return result;
    }

    // ---------- RSI ----------
    function rsi(closes, period = 14) {
        if (closes.length < period + 1) return null;
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            const diff = closes[i] - closes[i - 1];
            if (diff > 0) gains += diff;
            else losses -= diff;
        }
        let avgGain = gains / period;
        let avgLoss = losses / period;
        for (let i = period + 1; i < closes.length; i++) {
            const diff = closes[i] - closes[i - 1];
            const gain = diff > 0 ? diff : 0;
            const loss = diff < 0 ? -diff : 0;
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
        }
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - 100 / (1 + rs);
    }

    // ---------- MACD ----------
    function macd(closes, fast = 12, slow = 26, signal = 9) {
        if (closes.length < slow + signal) return null;
        const emaFast = ema(closes, fast);
        const emaSlow = ema(closes, slow);
        const len = Math.min(emaFast.length, emaSlow.length);
        const macdLine = [];
        for (let i = 0; i < len; i++) {
            macdLine.push(emaFast[emaFast.length - len + i] - emaSlow[emaSlow.length - len + i]);
        }
        const signalLine = ema(macdLine, signal);
        const histogram = macdLine.slice(macdLine.length - signalLine.length)
            .map((v, i) => v - signalLine[i]);
        return {
            macd: macdLine[macdLine.length - 1],
            signal: signalLine[signalLine.length - 1],
            histogram: histogram[histogram.length - 1],
        };
    }

    // ---------- Bollinger Bands ----------
    function bollingerBands(closes, period = 20, multiplier = 2) {
        if (closes.length < period) return null;
        const slice = closes.slice(-period);
        const mean = avg(slice);
        const std = Math.sqrt(avg(slice.map(v => Math.pow(v - mean, 2))));
        const upper = mean + multiplier * std;
        const lower = mean - multiplier * std;
        const price = closes[closes.length - 1];
        const pct = (price - lower) / (upper - lower);  // 0-1 arası
        return { upper, middle: mean, lower, price, pct };
    }

    // ---------- Stochastic ----------
    function stochastic(klines, kPeriod = 14, dPeriod = 3) {
        if (klines.length < kPeriod) return null;
        const slice = klines.slice(-kPeriod);
        const highMax = Math.max(...slice.map(k => k.high));
        const lowMin = Math.min(...slice.map(k => k.low));
        const close = klines[klines.length - 1].close;
        const kVal = ((close - lowMin) / (highMax - lowMin)) * 100;
        return { k: kVal, d: kVal };  // simplified
    }

    // ---------- ATR ----------
    function atr(klines, period = 14) {
        if (klines.length < period + 1) return null;
        const trs = [];
        for (let i = 1; i < klines.length; i++) {
            const hl = klines[i].high - klines[i].low;
            const hcp = Math.abs(klines[i].high - klines[i - 1].close);
            const lcp = Math.abs(klines[i].low - klines[i - 1].close);
            trs.push(Math.max(hl, hcp, lcp));
        }
        return avg(trs.slice(-period));
    }

    // ---------- Volume Trend ----------
    function volumeTrend(klines, period = 10) {
        if (klines.length < period) return null;
        const slice = klines.slice(-period);
        const up = slice.filter(k => k.close >= k.open);
        const dn = slice.filter(k => k.close < k.open);
        const upVol = up.reduce((a, k) => a + k.volume, 0);
        const dnVol = dn.reduce((a, k) => a + k.volume, 0);
        return { upVol, dnVol, ratio: upVol / (upVol + dnVol) };  // >0.5 = alıcı hakimiyeti
    }

    // ---------- EMA Trend ----------
    function emaTrend(closes) {
        const ema9 = ema(closes, 9);
        const ema21 = ema(closes, 21);
        const price = closes[closes.length - 1];
        return {
            ema9: ema9[ema9.length - 1],
            ema21: ema21[ema21.length - 1],
            above9: price > ema9[ema9.length - 1],
            above21: price > ema21[ema21.length - 1],
            cross: (ema9[ema9.length - 1] > ema21[ema21.length - 1]) ? 'golden' : 'death',
        };
    }

    // ---------- Master Hesapla ----------
    function calculate(klines) {
        const c = closes(klines);
        return {
            rsi: rsi(c),
            macd: macd(c),
            bb: bollingerBands(c),
            stoch: stochastic(klines),
            atr: atr(klines),
            volTrend: volumeTrend(klines),
            emaTrend: emaTrend(c),
        };
    }

    // ---------- Chart için Tarihsel BB ----------
    function bbHistory(closesArray, period = 20, multiplier = 2) {
        const result = { upper: [], lower: [] };
        if (closesArray.length < period) return result;

        for (let i = period - 1; i < closesArray.length; i++) {
            const slice = closesArray.slice(i - period + 1, i + 1);
            const mean = avg(slice);
            const std = Math.sqrt(avg(slice.map(v => Math.pow(v - mean, 2))));
            result.upper.push(mean + multiplier * std);
            result.lower.push(mean - multiplier * std);
        }
        return result; // [ { upper, lower }... length = closesArray.length - period + 1 ]
    }

    return { calculate, ema, sma, bbHistory };
})();
