export interface NestPayConfig {
    clientId: string;           // Müşteri Numarası
    username: string;           // API Kullanıcı Adı
    password: string;           // API Şifresi
    storeKey?: string;         // 3D Secure için Mağaza Anahtarı
    environment: 'TEST' | 'PROD';
    bank: 'isbank' | 'akbank' | 'denizbank' | 'halkbank' | 'ziraatbank' | 'teb' | 'finansbank' | 'anadolubank';
} 