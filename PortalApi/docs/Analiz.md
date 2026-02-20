# Uygulama Analizi ve Gereksinimler

## Proje Özeti
Admin ve Son Kullanıcı (User) rolleriyle ayrışan, .NET Core ve SQLite tabanlı, GridStack.js ile dinamik dashboard yönetimi sağlayan web uygulaması.

## Gereksinimler

### 1. Rol Bazlı Ekran Yönetimi
*   **Admin**:
    *   Son kullanıcı ekranını görür ama ek yetkilerle donatılmıştır.
    *   **Edit Modu**: Sağ üstteki "Edit" butonuna bastığında GridStack düzenlenebilir (draggable/resizable) hale gelir.
    *   Yeni widget ekleyebilir, silebilir, boyutlarını değiştirebilir.
*   **Son Kullanıcı (User)**:
    *   Ekranı sadece izleme (readonly) modunda görür.
    *   Dashboard yerleşimini değiştiremez (GridStack static mod).
    *   "Edit" butonunu görmez.

### 2. Sayfa Yerleşimi ve Navigasyon
*   **Sol Üst (Dashboard Seçimi)**:
    *   Açılır liste (Dropdown) içinde tanımlı dashboard'lar listelenir.
    *   Seçim değiştiğinde sayfa içeriği yenilenir.
    *   **Hatırlama**: Kullanıcı tekrar giriş yaptığında en son kaldığı dashboard otomatik açılır.
*   **Sağ Üst (Global Kontroller)**:
    1.  **Son Güncelleme**: Verinin çekildiği son zaman (örn: 14:35:00).
    2.  **Edit Butonu**: (Sadece Admin) Tasarım modunu açar/kapatır.
    3.  **Yenile Butonu**: Manuel olarak verileri günceller.
    4.  **Tam Ekran**: Tarayıcıyı tam ekran moduna alır.

### 3. Otomatik Yenileme (Auto-Refresh)
*   Her dashboard tanımı yapılırken bir **Yenileme Periyodu** (saniye cinsinden) belirlenir.
*   Sayfa açıkken bu periyot dolduğunda tüm widget verileri otomatik yenilenir.
*   Sayacın görselleştirilmesi (opsiyonel progres bar) eklenebilir.

### 4. Widget Tasarımı ve Etkileşimi
*   **Varsayılan Görünüm**: Sade. Sadece Başlık ve İçerik (Grafik/Tablo).
*   **Hover (Üzerine Gelme) Durumu**:
    *   Mouse widget'ın sağ üst köşesine yaklaştığında gizli bir **Toolbar** belirir.
*   **Widget Toolbar Butonları**:
    1.  **Tam Ekran**: O widget'ı tüm sayfayı kaplayacak şekilde büyütür (Modal veya GridStack maximize).
    2.  **Konfigüre Et**: Veri kaynağı, grafik tipi vb. ayarların yapıldığı modalı açar.