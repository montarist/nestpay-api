import { Currency } from '../enums/currency.enum';

export interface ThreeDSecureRequest {
    orderId?: string;
    amount: number;
    currency: Currency;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolderName: string;
    successUrl: string;
    failureUrl: string;
    installment?: number;
    description?: string;
    extra?: Record<string, string>;
} 