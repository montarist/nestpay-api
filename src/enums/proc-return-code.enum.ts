export enum ProcReturnCode {
    // Başarılı İşlemler
    SUCCESS = '00',                      // İşlem başarılı
    SUCCESS_WITH_WARNING = '01',         // İşlem başarılı, uyarı var

    // Kart Hataları
    INVALID_CARD = '05',                 // Kart hatası
    INVALID_CARD_TYPE = '12',            // Geçersiz kart tipi
    INSUFFICIENT_FUNDS = '51',           // Yetersiz bakiye
    EXPIRED_CARD = '54',                 // Kartın son kullanma tarihi geçmiş
    INVALID_CVC2 = '57',                 // Geçersiz CVC2
    STOLEN_CARD = '41',                  // Kayıp/Çalıntı kart
    RESTRICTED_CARD = '62',              // Kısıtlı kart
    SECURITY_VIOLATION = '63',           // Güvenlik ihlali
    EXCEEDS_LIMIT = '61',               // Limit aşımı

    // İşlem Hataları
    INVALID_MERCHANT = '03',             // Geçersiz üye işyeri
    DO_NOT_HONOR = '05',                 // İşleme onay verilmedi
    INVALID_TRANSACTION = '12',          // Geçersiz işlem
    INVALID_AMOUNT = '13',               // Geçersiz tutar
    DUPLICATE_ORDER = '34',              // Mükerrer sipariş
    DECLINED = '51',                     // İşlem reddedildi
    INVALID_INSTALLMENT = '52',          // Geçersiz taksit
    INVALID_ACCOUNT = '53',              // Hesap bulunamadı
    INVALID_MERCHANT_TYPE = '58',        // İşyeri tipi hatası

    // Sistem Hataları
    SYSTEM_ERROR = '96',                 // Sistem hatası
    TIMEOUT = '97',                      // Zaman aşımı
    DUPLICATE_REFERENCE = '98',          // Mükerrer referans numarası
    GENERAL_ERROR = '99',                // Genel hata, tekrar deneyin

    // 3D Secure Hataları
    INVALID_3D_SIGNATURE = '87',         // 3D imza hatası
    INVALID_3D_STATUS = '88',            // 3D durum hatası
    MISSING_3D_DATA = '89',              // 3D veri eksik

    // İade Hataları
    REFUND_NOT_ALLOWED = '80',           // İade yapılamaz
    REFUND_AMOUNT_EXCEEDED = '81',       // İade tutarı aşıldı
    REFUND_TIME_EXPIRED = '82',          // İade süresi geçti
} 