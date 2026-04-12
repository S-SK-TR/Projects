// ============================================
// 4Scalping — Config
// ============================================

const CONFIG = {
  // Coin definitions
  COINS: {
    BTC: { name: 'Bitcoin',   symbol: 'BTCUSDT', icon: '₿', decimals: 2 },
    SOL: { name: 'Solana',    symbol: 'SOLUSDT', icon: '◎', decimals: 3 },
    ETH: { name: 'Ethereum',  symbol: 'ETHUSDT', icon: 'Ξ', decimals: 2 },
    AVAX:{ name: 'Avalanche', symbol: 'AVAXUSDT',icon: '△', decimals: 3 },
    DOT: { name: 'Polkadot',  symbol: 'DOTUSDT', icon: '●', decimals: 3 },
  },

  // Binance public REST
  BINANCE_REST: 'https://api.binance.com/api/v3',

  // Kline intervals
  KLINE_INTERVAL: '1m',
  KLINE_LIMIT:    60,   // 60 adet 1-dakika mum

  // Timer
  PREDICTION_INTERVAL_MS: 60_000,   // Her 1 dakikada tahmin güncelleme
  PRICE_REFRESH_MS:        5_000,   // 5 sn'de bir fiyat

  // Gösterge eşikleri
  RSI: { OVERBOUGHT: 70, OVERSOLD: 30 },
  MACD_SIGNAL_THRESHOLD: 0.001,

  // Geçmiş max kayıt
  HISTORY_LIMIT: 20,
};
