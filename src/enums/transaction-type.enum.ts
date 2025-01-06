export enum TransactionType {
    AUTH = 'Auth',                    // Provizyon
    PREAUTH = 'PreAuth',             // Ön Otorizasyon
    POSTAUTH = 'PostAuth',           // Ön Otorizasyon Kapama
    VOID = 'Void',                   // İptal
    REFUND = 'Credit',               // İade
    INQUIRY = 'Inquiry',             // Sorgulama
    PAYMENT = 'Payment',             // Satış
    HISTORY = 'History',             // İşlem Tarihçesi
} 