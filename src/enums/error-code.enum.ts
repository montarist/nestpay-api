export enum ErrorCode {
    // Genel Hatalar
    SUCCESS = '00',                      // İşlem Başarılı
    DECLINED = '01',                     // Reddedildi
    INVALID_MERCHANT = '03',             // Geçersiz Üye İşyeri
    INVALID_TRANSACTION = '04',          // Geçersiz İşlem
    INVALID_CARD = '05',                 // Kart Hatası
    INVALID_AMOUNT = '06',               // Geçersiz Tutar
    TECHNICAL_ERROR = '07',              // Teknik Hata
    TIMEOUT = '08',                      // Zaman Aşımı
    DUPLICATE_ORDER = '09',              // Mükerrer Sipariş

    // 3D Secure Hataları
    INVALID_3D_SIGNATURE = '3D01',       // Geçersiz 3D İmza
    INVALID_3D_STATUS = '3D02',          // Geçersiz 3D Durumu
    MISSING_3D_DATA = '3D03',            // Eksik 3D Verisi

    // İade Hataları
    REFUND_NOT_ALLOWED = 'RF01',         // İade Yapılamaz
    REFUND_AMOUNT_EXCEEDED = 'RF02',     // İade Tutarı Aşıldı
    REFUND_TIME_EXPIRED = 'RF03',        // İade Süresi Geçti

    // Sistem Hataları
    SYSTEM_ERROR = 'SYS01',              // Sistem Hatası
    NETWORK_ERROR = 'SYS02',             // Ağ Hatası
    DATABASE_ERROR = 'SYS03',            // Veritabanı Hatası
} 