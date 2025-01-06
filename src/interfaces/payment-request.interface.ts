import { Currency } from '../enums/currency.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { Address } from './address.interface';
import { OrderItem } from './order-item.interface';

export interface PaymentRequest {
    // Temel Bilgiler
    type: TransactionType;
    orderId?: string;
    groupId?: string;
    transId?: string;

    // Tutar Bilgileri
    amount: number;
    currency: Currency;
    installment?: number;

    // Kart Bilgileri
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolderName: string;

    // Müşteri Bilgileri
    ipAddress?: string;
    email?: string;

    // 3D Secure Bilgileri
    payerSecurityLevel?: string;  // ECI
    payerTxnId?: string;         // XID
    payerAuthenticationCode?: string;  // CAVV

    // Adres Bilgileri
    billTo?: Address;
    shipTo?: Address;

    // Sipariş Detayları
    orderItems?: OrderItem[];

    // Ek Bilgiler
    description?: string;
    extra?: Record<string, string>;
} 