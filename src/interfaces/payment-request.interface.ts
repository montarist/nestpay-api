import { Currency } from '../enums/currency.enum';
import { TransactionType } from '../enums/transaction-type.enum';

export interface PaymentRequest {
    type: TransactionType;
    amount: number;
    currency: Currency;
    orderId: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolderName: string;
    installment?: number;
    description?: string;
    extra?: Record<string, string>;
} 