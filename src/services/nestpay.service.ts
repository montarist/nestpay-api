import axios from 'axios';
import { createHash } from 'crypto';
import { parseStringPromise } from 'xml2js';
import { Currency } from '../enums/currency.enum';
import { ErrorCode } from '../enums/error-code.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { ThreeDSecureRequest } from '../interfaces/3d-secure-request.interface';
import { ThreeDSecureResponse } from '../interfaces/3d-secure-response.interface';
import { NestPayConfig } from '../interfaces/nestpay-config.interface';
import { PaymentRequest } from '../interfaces/payment-request.interface';
import { PaymentResponse } from '../interfaces/payment-response.interface';

export class NestPayService {
    private readonly config: NestPayConfig;
    private readonly baseUrl: string;
    private readonly threeDUrl: string;

    constructor(config: NestPayConfig) {
        this.config = config;
        this.baseUrl = this.getBaseUrl();
        this.threeDUrl = this.getThreeDUrl();
    }

    private getBaseUrl(): string {
        const urls: Record<string, { TEST: string; PROD: string }> = {
            isbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/api',
                PROD: 'https://spos.isbank.com.tr/fim/api'
            },
            akbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/api',
                PROD: 'https://www.sanalakpos.com/fim/api'
            },
            denizbank: {
                TEST: 'https://test.denizbank.com.tr/fim/api',
                PROD: 'https://sanalpos.denizbank.com.tr/fim/api'
            },
            halkbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/api',
                PROD: 'https://sanalpos.halkbank.com.tr/fim/api'
            },
            ziraatbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/api',
                PROD: 'https://sanalpos.ziraatbank.com.tr/fim/api'
            },
            teb: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/api',
                PROD: 'https://sanalpos.teb.com.tr/fim/api'
            },
            finansbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/api',
                PROD: 'https://sanalpos.qnbfinansbank.com/fim/api'
            },
            anadolubank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/api',
                PROD: 'https://sanalpos.anadolubank.com.tr/fim/api'
            }
        };

        return urls[this.config.bank]?.[this.config.environment] || urls.isbank[this.config.environment];
    }

    private getThreeDUrl(): string {
        const urls: Record<string, { TEST: string; PROD: string }> = {
            isbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
                PROD: 'https://spos.isbank.com.tr/fim/est3Dgate'
            },
            akbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
                PROD: 'https://www.sanalakpos.com/fim/est3Dgate'
            },
            denizbank: {
                TEST: 'https://test.denizbank.com.tr/fim/est3Dgate',
                PROD: 'https://sanalpos.denizbank.com.tr/fim/est3Dgate'
            },
            halkbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
                PROD: 'https://sanalpos.halkbank.com.tr/fim/est3Dgate'
            },
            ziraatbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
                PROD: 'https://sanalpos.ziraatbank.com.tr/fim/est3Dgate'
            },
            teb: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
                PROD: 'https://sanalpos.teb.com.tr/fim/est3Dgate'
            },
            finansbank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
                PROD: 'https://sanalpos.qnbfinansbank.com/fim/est3Dgate'
            },
            anadolubank: {
                TEST: 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate',
                PROD: 'https://sanalpos.anadolubank.com.tr/fim/est3Dgate'
            }
        };

        return urls[this.config.bank]?.[this.config.environment] || urls.isbank[this.config.environment];
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const xmlRequest = this.buildXmlRequest(request);
            const response = await axios.post(this.baseUrl, xmlRequest, {
                headers: { 'Content-Type': 'application/xml' }
            });

            const result = await parseStringPromise(response.data);
            return this.parseResponse(result);
        } catch (error) {
            return {
                status: TransactionStatus.ERROR,
                orderId: request.orderId,
                responseCode: ErrorCode.SYSTEM_ERROR,
                responseMessage: error.message
            };
        }
    }

    async initiate3DSecure(request: ThreeDSecureRequest): Promise<ThreeDSecureResponse> {
        try {
            if (!this.config.storeKey) {
                throw new Error('Store key is required for 3D Secure transactions');
            }

            const hashData = this.createSecureHash(request);
            const formData = this.create3DFormData(request, hashData);

            return {
                status: '3D_PENDING',
                redirectUrl: this.threeDUrl,
                ...formData
            };
        } catch (error) {
            return {
                status: '3D_ERROR',
                errorCode: ErrorCode.INVALID_3D_SIGNATURE,
                errorMessage: error.message
            };
        }
    }

    async process3DCallback(callbackData: any): Promise<PaymentResponse> {
        try {
            const { md, xid, eci, cavv, status } = callbackData;

            if (!callbackData.oid || !callbackData.amount) {
                throw new Error('Invalid callback data');
            }

            if (status !== 'success') {
                return {
                    status: TransactionStatus.DECLINED,
                    orderId: callbackData.oid || '',
                    responseCode: ErrorCode.INVALID_3D_STATUS,
                    responseMessage: '3D Authentication failed'
                };
            }

            // 3D sonrası ödeme işlemi
            const paymentRequest: PaymentRequest = {
                ...callbackData,
                type: TransactionType.AUTH,
                amount: parseFloat(callbackData.amount),
                currency: Currency.TRY,
                cardNumber: '',
                expiryMonth: '',
                expiryYear: '',
                cvv: '',
                cardHolderName: '',
                extra: {
                    md,
                    xid,
                    eci,
                    cavv,
                    '3d': 'true'
                }
            };

            return this.processPayment(paymentRequest);
        } catch (error) {
            return {
                status: TransactionStatus.ERROR,
                orderId: callbackData?.oid || '',
                responseCode: ErrorCode.SYSTEM_ERROR,
                responseMessage: error.message
            };
        }
    }

    async refund(orderId: string, amount: number): Promise<PaymentResponse> {
        try {
            const refundRequest: PaymentRequest = {
                type: TransactionType.REFUND,
                orderId,
                amount,
                currency: Currency.TRY,
                cardNumber: '',
                expiryMonth: '',
                expiryYear: '',
                cvv: '',
                cardHolderName: ''
            };

            const xmlRequest = this.buildXmlRequest(refundRequest);
            const response = await axios.post(this.baseUrl, xmlRequest, {
                headers: { 'Content-Type': 'application/xml' }
            });

            const result = await parseStringPromise(response.data);
            return this.parseResponse(result);
        } catch (error) {
            return {
                status: TransactionStatus.ERROR,
                orderId,
                responseCode: ErrorCode.REFUND_NOT_ALLOWED,
                responseMessage: error.message
            };
        }
    }

    private createSecureHash(request: ThreeDSecureRequest): string {
        const hashStr = `${this.config.clientId}${request.orderId}${request.amount}${request.successUrl}${request.failureUrl}${this.config.storeKey}`;
        return createHash('sha1').update(hashStr).digest('base64');
    }

    private create3DFormData(request: ThreeDSecureRequest, hashData: string) {
        return {
            clientId: this.config.clientId,
            oid: request.orderId,
            amount: request.amount.toString(),
            okUrl: request.successUrl,
            failUrl: request.failureUrl,
            rnd: Date.now().toString(),
            hash: hashData,
            storetype: '3d',
            lang: 'tr'
        };
    }

    private buildXmlRequest(request: PaymentRequest): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
        <CC5Request>
            <Name>${this.config.username}</Name>
            <Password>${this.config.password}</Password>
            <ClientId>${this.config.clientId}</ClientId>
            <Type>${request.type}</Type>
            <Amount>${request.amount}</Amount>
            <Currency>${request.currency}</Currency>
            <OrderId>${request.orderId}</OrderId>
            ${request.cardNumber ? `<Pan>${request.cardNumber}</Pan>` : ''}
            ${request.expiryMonth ? `<Expires>${request.expiryMonth}/${request.expiryYear}</Expires>` : ''}
            ${request.cvv ? `<Cvv2Val>${request.cvv}</Cvv2Val>` : ''}
            ${request.extra ? Object.entries(request.extra).map(([key, value]) => `<${key}>${value}</${key}>`).join('') : ''}
        </CC5Request>`;
    }

    private parseResponse(xmlResponse: any): PaymentResponse {
        const response = xmlResponse.CC5Response;
        const extra = response.Extra?.[0];

        return {
            status: response.Response[0] === 'Approved'
                ? TransactionStatus.APPROVED
                : TransactionStatus.DECLINED,
            transactionId: response.TransId?.[0],
            orderId: response.OrderId[0],
            responseCode: response.ProcReturnCode[0],
            responseMessage: response.ErrMsg?.[0] || response.Response[0],
            authCode: response.AuthCode?.[0],
            hostRefNum: response.HostRefNum?.[0],
            procReturnCode: response.ProcReturnCode?.[0],
            tranDate: extra?.TranDate?.[0]
        };
    }
} 