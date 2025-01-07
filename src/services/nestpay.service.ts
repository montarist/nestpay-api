import axios from 'axios';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { parseStringPromise } from 'xml2js';
import { Currency } from '../enums/currency.enum';
import { ErrorCode } from '../enums/error-code.enum';
import { ProcReturnCode } from '../enums/proc-return-code.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { ThreeDSecureRequest } from '../interfaces/3d-secure-request.interface';
import { ThreeDSecureResponse } from '../interfaces/3d-secure-response.interface';
import { BaseRequest } from '../interfaces/base-request.interface';
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
                TEST: 'https://istest.asseco-see.com.tr/fim/api',
                PROD: 'https://sanalpos.isbank.com.tr/fim/api'
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
                PROD: 'https://sanalpos.isbank.com.tr/fim/est3Dgate'
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
            const processedRequest = {
                ...request,
                orderId: request.orderId || uuidv4().replace(/-/g, '')
            };

            const xmlRequest = this.buildXmlRequest(processedRequest);
            const response = await axios.post(this.baseUrl, xmlRequest, {
                headers: { 'Content-Type': 'application/xml' }
            });

            const result = await parseStringPromise(response.data);
            return this.parseResponse(result);
        } catch (error) {
            return {
                status: TransactionStatus.ERROR,
                orderId: request.orderId || '',
                responseCode: ErrorCode.SYSTEM_ERROR,
                responseMessage: error.message,
                procReturnCode: ProcReturnCode.SYSTEM_ERROR
            };
        }
    }

    async initiate3DSecure(request: ThreeDSecureRequest): Promise<ThreeDSecureResponse> {
        try {
            if (!this.config.storeKey) {
                throw new Error('Store key is required for 3D Secure transactions');
            }

            const processedRequest = {
                ...request,
                orderId: request.orderId || uuidv4().replace(/-/g, '')
            };

            const hashData = this.createSecureHash(processedRequest);
            const formData = this.create3DFormData(processedRequest, hashData);

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
                    responseMessage: '3D Authentication failed',
                    procReturnCode: ProcReturnCode.INVALID_3D_STATUS
                };
            }

            // 3D sonrası ödeme işlemi
            const paymentRequest: PaymentRequest = {
                ...callbackData,
                type: TransactionType.AUTH,
                amount: parseFloat(callbackData.amount),
                currency: callbackData.currency,
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
                responseMessage: error.message,
                procReturnCode: ProcReturnCode.SYSTEM_ERROR
            };
        }
    }

    async refund(orderId: string, amount: number, currency: Currency = Currency.TRY): Promise<PaymentResponse> {
        try {
            const refundRequest: PaymentRequest = {
                type: TransactionType.REFUND,
                orderId,
                amount,
                currency,
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
                responseMessage: error.message,
                procReturnCode: ProcReturnCode.REFUND_NOT_ALLOWED
            };
        }
    }

    async cancelWithOrderId(orderId: string): Promise<PaymentResponse> {
        try {
            const voidRequest: BaseRequest = {
                type: TransactionType.VOID,
                orderId
            };

            const xmlRequest = this.buildXmlRequest(voidRequest);
            const response = await axios.post(this.baseUrl, xmlRequest, {
                headers: { 'Content-Type': 'application/xml' }
            });

            const result = await parseStringPromise(response.data);
            return this.parseResponse(result);
        } catch (error) {
            return {
                status: TransactionStatus.ERROR,
                orderId,
                responseCode: ErrorCode.SYSTEM_ERROR,
                responseMessage: error.message,
                procReturnCode: ProcReturnCode.SYSTEM_ERROR
            };
        }
    }

    async cancelWithTransId(transId: string): Promise<PaymentResponse> {
        try {
            const voidRequest: BaseRequest = {
                type: TransactionType.VOID,
                transId
            };

            const xmlRequest = this.buildXmlRequest(voidRequest);
            const response = await axios.post(this.baseUrl, xmlRequest, {
                headers: { 'Content-Type': 'application/xml' }
            });

            const result = await parseStringPromise(response.data);
            return this.parseResponse(result);
        } catch (error) {
            return {
                status: TransactionStatus.ERROR,
                orderId: '',
                responseCode: ErrorCode.SYSTEM_ERROR,
                responseMessage: error.message,
                procReturnCode: ProcReturnCode.SYSTEM_ERROR
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

    private buildXmlRequest(request: BaseRequest | PaymentRequest): string {
        const buildAddress = (address: any, type: 'BillTo' | 'ShipTo') => {
            if (!address) return '';
            return `
            <${type}>
                <Name>${address.name}</Name>
                ${address.company ? `<Company>${address.company}</Company>` : ''}
                <Street1>${address.street1}</Street1>
                ${address.street2 ? `<Street2>${address.street2}</Street2>` : ''}
                ${address.street3 ? `<Street3>${address.street3}</Street3>` : ''}
                <City>${address.city}</City>
                <StateProv>${address.stateProv}</StateProv>
                <PostalCode>${address.postalCode}</PostalCode>
                <Country>${address.country}</Country>
                <TelVoice>${address.telVoice}</TelVoice>
            </${type}>`;
        };

        const buildOrderItems = (items: any[]) => {
            if (!items?.length) return '';
            return `
            <OrderItemList>
                ${items.map(item => `
                <OrderItem>
                    <ItemNumber>${item.itemNumber}</ItemNumber>
                    <ProductCode>${item.productCode}</ProductCode>
                    <Qty>${item.qty}</Qty>
                    <Desc>${item.desc}</Desc>
                    <Id>${item.id}</Id>
                    <Price>${item.price}</Price>
                    <Total>${item.total}</Total>
                </OrderItem>`).join('')}
            </OrderItemList>`;
        };

        const paymentRequest = request as PaymentRequest;

        return `<?xml version="1.0" encoding="UTF-8"?>
        <CC5Request>
            <Name>${this.config.username}</Name>
            <Password>${this.config.password}</Password>
            <ClientId>${this.config.clientId}</ClientId>
            <Type>${request.type}</Type>
            ${request.orderId ? `<OrderId>${request.orderId}</OrderId>` : ''}
            ${request.transId ? `<TransId>${request.transId}</TransId>` : ''}
            ${paymentRequest.amount ? `<Amount>${paymentRequest.amount}</Amount>` : ''}
            ${paymentRequest.currency ? `<Currency>${paymentRequest.currency}</Currency>` : ''}
            ${paymentRequest.groupId ? `<GroupId>${paymentRequest.groupId}</GroupId>` : ''}
            ${paymentRequest.ipAddress ? `<IPAddress>${paymentRequest.ipAddress}</IPAddress>` : ''}
            ${paymentRequest.email ? `<Email>${paymentRequest.email}</Email>` : ''}
            ${paymentRequest.cardNumber ? `<Number>${paymentRequest.cardNumber}</Number>` : ''}
            ${paymentRequest.expiryMonth ? `<Expires>${paymentRequest.expiryMonth}/${paymentRequest.expiryYear}</Expires>` : ''}
            ${paymentRequest.cvv ? `<Cvv2Val>${paymentRequest.cvv}</Cvv2Val>` : ''}
            ${paymentRequest.installment ? `<Instalment>${paymentRequest.installment}</Instalment>` : ''}
            ${paymentRequest.payerSecurityLevel ? `<PayerSecurityLevel>${paymentRequest.payerSecurityLevel}</PayerSecurityLevel>` : ''}
            ${paymentRequest.payerTxnId ? `<PayerTxnId>${paymentRequest.payerTxnId}</PayerTxnId>` : ''}
            ${paymentRequest.payerAuthenticationCode ? `<PayerAuthenticationCode>${paymentRequest.payerAuthenticationCode}</PayerAuthenticationCode>` : ''}
            ${paymentRequest.billTo ? buildAddress(paymentRequest.billTo, 'BillTo') : ''}
            ${paymentRequest.shipTo ? buildAddress(paymentRequest.shipTo, 'ShipTo') : ''}
            ${paymentRequest.orderItems ? buildOrderItems(paymentRequest.orderItems) : ''}
            ${paymentRequest.extra ? Object.entries(paymentRequest.extra).map(([key, value]) => `<${key}>${value}</${key}>`).join('') : ''}
        </CC5Request>`;
    }

    private parseResponse(xmlResponse: any): PaymentResponse {
        const response = xmlResponse.CC5Response;
        const extra = response.Extra?.[0];
        const procReturnCode = response.ProcReturnCode?.[0] || '99';

        // Hata mesajlarını özelleştir
        let responseMessage = response.ErrMsg?.[0] || response.Response[0];
        switch (procReturnCode) {
            case ProcReturnCode.INSUFFICIENT_FUNDS:
                responseMessage = 'Yetersiz bakiye';
                break;
            case ProcReturnCode.INVALID_CVC2:
                responseMessage = 'Geçersiz güvenlik kodu';
                break;
            case ProcReturnCode.EXPIRED_CARD:
                responseMessage = 'Kartın son kullanma tarihi geçmiş';
                break;
            case ProcReturnCode.STOLEN_CARD:
                responseMessage = 'Kayıp/Çalıntı kart';
                break;
            case ProcReturnCode.RESTRICTED_CARD:
                responseMessage = 'Kısıtlı kart';
                break;
            case ProcReturnCode.SECURITY_VIOLATION:
                responseMessage = 'Güvenlik ihlali';
                break;
            case ProcReturnCode.EXCEEDS_LIMIT:
                responseMessage = 'İşlem limiti aşıldı';
                break;
            case ProcReturnCode.INVALID_INSTALLMENT:
                responseMessage = 'Geçersiz taksit sayısı';
                break;
            case ProcReturnCode.DUPLICATE_ORDER:
                responseMessage = 'Bu sipariş daha önce işleme alınmış';
                break;
            case ProcReturnCode.GENERAL_ERROR:
                responseMessage = 'İşlem başarısız, lütfen daha sonra tekrar deneyiniz';
                break;
        }

        return {
            status: response.Response[0] === 'Approved'
                ? TransactionStatus.APPROVED
                : TransactionStatus.DECLINED,
            transactionId: response.TransId?.[0],
            orderId: response.OrderId[0],
            responseCode: procReturnCode,
            responseMessage: responseMessage,
            authCode: response.AuthCode?.[0],
            hostRefNum: response.HostRefNum?.[0],
            procReturnCode: procReturnCode as ProcReturnCode,
            tranDate: extra?.TranDate?.[0]
        };
    }
} 