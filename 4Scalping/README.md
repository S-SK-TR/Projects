# 4Scalping

**Kripto Long/Short Tahmin & 1 Dakika Fiyat Tahmini PWA**

## 🚀 Proje Hakkında

BTC, SOL, ETH, AVAX, DOT coinleri için:
- **Long/Short sinyalleri** (RSI, MACD, BB, Stochastic, EMA, Volume)
- **1 dakika sonra USDT fiyat tahmini** (ATR tabanlı)
- **Gerçek zamanlı Binance API** verileri
- **Progressive Web App (PWA)** — mobilde "Ana Ekrana Ekle" ile uygulama gibi kullan

## 📂 Yapı

```
4Scalping/
├── index.html          # Ana sayfa (PWA shell)
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline desteği)
├── icons/
│   ├── icon-192.png   # PWA ikonu
│   └── icon-512.png   # PWA ikonu büyük
└── src/
    ├── css/
    │   └── main.css   # Design system + tüm stiller
    └── js/
        ├── config.js      # Sabitler ve ayarlar
        ├── api.js         # Binance REST API wrapper
        ├── indicators.js  # RSI, MACD, BB, Stoch, EMA, ATR, Vol
        ├── predictor.js   # Skor motoru + fiyat tahmini
        ├── ui.js          # DOM renderer, sparkline, timer
        └── app.js         # Ana uygulama kontrolcüsü
```

## 🖥️ Yerel Çalıştırma

```powershell
cd c:\MyAntiProjects\4Scalping

# Python ile (kuruluysa)
python -m http.server 8080

# Ya da Node.js ile
npx -y serve . -p 8080
```

Tarayıcıda: `http://localhost:8080`

## 📱 Mobilde PWA Kurulumu

1. Chrome/Safari ile `http://localhost:8080` aç
2. Tarayıcı menüsü → **"Ana Ekrana Ekle"**
3. Uygulama olarak kayıt!

## 📡 Veri Kaynağı

Binance Public REST API — API key gerektirmez.

| Endpoint | Kullanım |
|---|---|
| `/ticker/price` | Anlık fiyat (5sn'de güncelleme) |
| `/ticker/24hr` | 24s değişim, hacim |
| `/klines` | 1m mum verileri (60 adet) |

## ⚙️ Teknik Göstergeler

| Gösterge | Parametre |
|---|---|
| RSI | 14 periyot |
| MACD | 12/26/9 |
| Bollinger Bands | 20 periyot, 2σ |
| Stochastic | 14 periyot |
| EMA | 9 / 21 |
| ATR | 14 periyot |
| Volume Trend | 10 mum |
