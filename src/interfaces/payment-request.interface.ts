import { Currency } from '../enums/currency.enum';
import { Address } from './address.interface';
import { BaseRequest } from './base-request.interface';
import { OrderItem } from './order-item.interface';

export interface PaymentRequest extends BaseRequest {
    amount: number;
    currency: Currency;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardHolderName: string;
    installment?: number;
    description?: string;
    ipAddress?: string;
    email?: string;
    groupId?: string;
    payerSecurityLevel?: string;
    payerTxnId?: string;
    payerAuthenticationCode?: string;
    billTo?: Address;
    shipTo?: Address;
    orderItems?: OrderItem[];
    extra?: Record<string, string>;
} 