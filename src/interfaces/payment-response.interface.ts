import { ProcReturnCode } from '../enums/proc-return-code.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export interface PaymentResponse {
    status: TransactionStatus;
    transactionId?: string;
    orderId: string;
    responseCode: string;
    responseMessage: string;
    authCode?: string;
    hostRefNum?: string;
    procReturnCode: ProcReturnCode;
    tranDate?: string;
    extra?: Record<string, string>;
} 