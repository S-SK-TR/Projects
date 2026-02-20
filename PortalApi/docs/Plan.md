# Uygulama Geliştirme Planı

## Faz 1: Altyapı ve Kurulum (.NET Core)
1.  `.NET Core Web API` projesinin oluşturulması (`dotnet new webapi`).
2.  Gerekli NuGet paketlerinin yüklenmesi:
    *   `Microsoft.EntityFrameworkCore.Sqlite`
    *   `Microsoft.AspNetCore.Authentication.JwtBearer`
3.  Entity Classes (Modeller) ve DbContext'in oluşturulması.
4.  Migration oluşturup veritabanının güncellenmesi (`dotnet ef migrations add Initial`).

## Faz 2: Backend API Geliştirme
1.  **Auth Service**: JWT token üretimi ve şifreleme mantığı.
2.  **Controllers**:
    *   `AuthController`: Login, Register.
    *   `UsersController`: CRUD işlemleri (Admin only - `[Authorize(Roles = "Admin")]`).
    *   `DashboardsController`: Layout kaydetme/okuma.
3.  Swagger üzerinden API testleri.

## Faz 3: Frontend Geliştirme
1.  Projenin `wwwroot` klasörüne HTML/CSS/JS yapısının kurulması.
2.  **Login Entegrasyonu**: API'den token alma ve saklama (`localStorage`).
3.  **Admin Paneli**:
    *   Kullanıcı listesi tablosu.
    *   GridStack editör arayüzü.
4.  **User Paneli**:
    *   API'den gelen JSON verisiyle GridStack'in `load()` edilmesi.

## Faz 4: Görselleştirme ve İyileştirme
1.  Modern bir UI tasarımı (Tercihen Bootstrap veya özel CSS).
2.  Widget içeriklerinin zenginleştirilmesi (Chart.js vb.).