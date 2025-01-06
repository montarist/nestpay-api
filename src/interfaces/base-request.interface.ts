import { TransactionType } from '../enums/transaction-type.enum';

export interface BaseRequest {
    type: TransactionType;
    orderId?: string;
    transId?: string;
} 