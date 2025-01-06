import axios from 'axios';
import { Currency } from '../enums/currency.enum';
import { ErrorCode } from '../enums/error-code.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { NestPayService } from './nestpay.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NestPayService', () => {
    let service: NestPayService;

    beforeEach(() => {
        service = new NestPayService({
            clientId: 'test-client',
            username: 'test-user',
            password: 'test-pass',
            storeKey: 'test-store-key',
            environment: 'TEST',
            bank: 'isbank'
        });
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default URLs for unknown bank', () => {
            const unknownBankService = new NestPayService({
                clientId: 'test-client',
                username: 'test-user',
                password: 'test-pass',
                environment: 'TEST',
                bank: 'denizbank'
            });
            expect(unknownBankService).toBeDefined();
        });
    });

    describe('processPayment', () => {
        it('should process a successful payment', async () => {
            const mockResponse = {
                data: `<?xml version="1.0" encoding="UTF-8"?>
                    <CC5Response>
                        <OrderId>12345</OrderId>
                        <Response>Approved</Response>
                        <AuthCode>123456</AuthCode>
                        <HostRefNum>REF123</HostRefNum>
                        <ProcReturnCode>00</ProcReturnCode>
                        <TransId>789</TransId>
                        <ErrMsg>Success</ErrMsg>
                        <Extra>
                            <TranDate>20240101</TranDate>
                        </Extra>
                    </CC5Response>`
            };

            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const result = await service.processPayment({
                type: TransactionType.PAYMENT,
                amount: 100.50,
                currency: Currency.TRY,
                orderId: '12345',
                cardNumber: '4444333322221111',
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                cardHolderName: 'Test User',
                installment: 1,
                description: 'Test Payment',
                extra: {
                    udf1: 'test'
                }
            });

            expect(result.status).toBe(TransactionStatus.APPROVED);
            expect(result.orderId).toBe('12345');
            expect(result.authCode).toBe('123456');
            expect(result.tranDate).toBe('20240101');
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('<Type>Payment</Type>'),
                expect.any(Object)
            );
        });

        it('should handle declined payment', async () => {
            const mockResponse = {
                data: `<?xml version="1.0" encoding="UTF-8"?>
                    <CC5Response>
                        <OrderId>12345</OrderId>
                        <Response>Declined</Response>
                        <ProcReturnCode>01</ProcReturnCode>
                        <ErrMsg>Insufficient funds</ErrMsg>
                    </CC5Response>`
            };

            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const result = await service.processPayment({
                type: TransactionType.PAYMENT,
                amount: 100.50,
                currency: Currency.TRY,
                orderId: '12345',
                cardNumber: '4444333322221111',
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                cardHolderName: 'Test User'
            });

            expect(result.status).toBe(TransactionStatus.DECLINED);
            expect(result.responseMessage).toBe('Insufficient funds');
        });

        it('should handle payment errors', async () => {
            mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

            const result = await service.processPayment({
                type: TransactionType.PAYMENT,
                amount: 100.50,
                currency: Currency.TRY,
                orderId: '12345',
                cardNumber: '4444333322221111',
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                cardHolderName: 'Test User'
            });

            expect(result.status).toBe(TransactionStatus.ERROR);
            expect(result.responseCode).toBe(ErrorCode.SYSTEM_ERROR);
        });
    });

    describe('initiate3DSecure', () => {
        it('should initiate 3D Secure process', async () => {
            const result = await service.initiate3DSecure({
                orderId: '12345',
                amount: 100.50,
                currency: Currency.TRY,
                cardNumber: '4444333322221111',
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                cardHolderName: 'Test User',
                successUrl: 'https://example.com/success',
                failureUrl: 'https://example.com/failure'
            });

            expect(result.status).toBe('3D_PENDING');
            expect(result.redirectUrl).toBeTruthy();
            expect(result.hash).toBeTruthy();
            expect(result.clientId).toBe('test-client');
            expect(result.amount).toBe('100.5');
        });

        it('should handle 3D Secure errors', async () => {
            const serviceWithoutStoreKey = new NestPayService({
                clientId: 'test-client',
                username: 'test-user',
                password: 'test-pass',
                environment: 'TEST',
                bank: 'isbank'
            });

            const result = await serviceWithoutStoreKey.initiate3DSecure({
                orderId: '12345',
                amount: 100.50,
                currency: Currency.TRY,
                cardNumber: '4444333322221111',
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                cardHolderName: 'Test User',
                successUrl: 'https://example.com/success',
                failureUrl: 'https://example.com/failure'
            });

            expect(result.status).toBe('3D_ERROR');
            expect(result.errorCode).toBe(ErrorCode.INVALID_3D_SIGNATURE);
        });
    });

    describe('process3DCallback', () => {
        it('should process successful 3D callback', async () => {
            const mockResponse = {
                data: `<?xml version="1.0" encoding="UTF-8"?>
                    <CC5Response>
                        <OrderId>12345</OrderId>
                        <Response>Approved</Response>
                        <ProcReturnCode>00</ProcReturnCode>
                    </CC5Response>`
            };

            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const result = await service.process3DCallback({
                oid: '12345',
                status: 'success',
                md: 'md123',
                xid: 'xid123',
                eci: 'eci123',
                cavv: 'cavv123',
                amount: '100.50'
            });

            expect(result.status).toBe(TransactionStatus.APPROVED);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('<Type>Auth</Type>'),
                expect.any(Object)
            );
        });

        it('should handle failed 3D authentication', async () => {
            const result = await service.process3DCallback({
                oid: '12345',
                status: 'failure',
                amount: '100.50'
            });

            expect(result.status).toBe(TransactionStatus.DECLINED);
            expect(result.responseCode).toBe(ErrorCode.INVALID_3D_STATUS);
        });

        it('should handle 3D callback errors', async () => {
            const result = await service.process3DCallback({});

            expect(result.status).toBe(TransactionStatus.ERROR);
            expect(result.responseCode).toBe(ErrorCode.SYSTEM_ERROR);
        });
    });

    describe('refund', () => {
        it('should process a successful refund', async () => {
            const mockResponse = {
                data: `<?xml version="1.0" encoding="UTF-8"?>
                    <CC5Response>
                        <OrderId>12345</OrderId>
                        <Response>Approved</Response>
                        <ProcReturnCode>00</ProcReturnCode>
                        <TransId>789</TransId>
                    </CC5Response>`
            };

            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const result = await service.refund('12345', 100.50);

            expect(result.status).toBe(TransactionStatus.APPROVED);
            expect(result.orderId).toBe('12345');
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('<Type>Credit</Type>'),
                expect.any(Object)
            );
        });

        it('should handle refund errors', async () => {
            mockedAxios.post.mockRejectedValueOnce(new Error('Refund not allowed'));

            const result = await service.refund('12345', 100.50);

            expect(result.status).toBe(TransactionStatus.ERROR);
            expect(result.responseCode).toBe(ErrorCode.REFUND_NOT_ALLOWED);
        });
    });
}); 