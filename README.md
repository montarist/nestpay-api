# UNOFFICIAL NestPay API

This is Unofficial NestPay payment gateway integration for Node.js and NestJS applications. This package provides a simple and type-safe way to integrate with Turkish banks using the NestPay payment gateway.

## Features

- TypeScript support with full type definitions
- Support for multiple Turkish banks (İş Bankası, Akbank, Denizbank, etc.)
- Easy to use API with Promise-based methods
- Comprehensive error handling
- Both Node.js and NestJS support
- Full XML field support including billing, shipping, and order details
- Auto-generated order IDs (UUID)

## Installation

```bash
npm install @montarist/nestpay-api
```

## Usage

### Basic Usage (Node.js)

```typescript
const { NestPayService, TransactionType, Currency } = require('@montarist/nestpay-api');

// Initialize the service
const nestpay = new NestPayService({
	clientId: 'YOUR_CLIENT_ID',
	username: 'YOUR_API_USERNAME',
	password: 'YOUR_API_PASSWORD',
	environment: 'TEST', // or 'PROD'
	bank: 'isbank',
});

// Process a payment with all details
async function processDetailedPayment() {
	try {
		const response = await nestpay.processPayment({
			// Temel Bilgiler
			type: TransactionType.PAYMENT,
			orderId: '12345',
			groupId: 'GROUP1',
			transId: 'TRANS1',

			// Tutar Bilgileri
			amount: 100.5,
			currency: Currency.TRY,
			installment: 1,

			// Kart Bilgileri
			cardNumber: '4444333322221111',
			expiryMonth: '12',
			expiryYear: '25',
			cvv: '123',
			cardHolderName: 'John Doe',

			// Müşteri Bilgileri
			ipAddress: '192.168.1.1',
			email: 'customer@example.com',

			// Fatura Bilgileri
			billTo: {
				name: 'John Doe',
				company: 'Example Corp',
				street1: 'Invoice Street',
				street2: 'No: 123',
				city: 'Istanbul',
				stateProv: 'Kadikoy',
				postalCode: '34700',
				country: 'TR',
				telVoice: '+902121234567',
			},

			// Teslimat Bilgileri
			shipTo: {
				name: 'Jane Doe',
				street1: 'Shipping Street',
				city: 'Istanbul',
				stateProv: 'Besiktas',
				postalCode: '34353',
				country: 'TR',
				telVoice: '+902121234567',
			},

			// Sipariş Detayları
			orderItems: [
				{
					itemNumber: 'ITEM1',
					productCode: 'PRD1',
					qty: 2,
					desc: 'Example Product',
					id: '1',
					price: 50.25,
					total: 100.5,
				},
			],
		});

		console.log(response);
	} catch (error) {
		console.error(error);
	}
}
```

### 3D Secure Payment

```typescript
// 1. 3D Secure başlatma
const threeDResponse = await nestpay.initiate3DSecure({
	orderId: '12345',
	amount: 100.5,
	currency: Currency.TRY,
	cardNumber: '4444333322221111',
	expiryMonth: '12',
	expiryYear: '25',
	cvv: '123',
	cardHolderName: 'John Doe',
	successUrl: 'https://your-site.com/success',
	failureUrl: 'https://your-site.com/failure',
});

// 2. 3D Secure sonrası ödeme tamamlama
const paymentResponse = await nestpay.process3DCallback({
	oid: '12345',
	status: 'success',
	md: 'md123',
	xid: 'xid123',
	eci: 'eci123',
	cavv: 'cavv123',
	amount: '100.50',
});
```

### İade İşlemi

```typescript
const refundResponse = await nestpay.refund('12345', 100.5);
```

### İptal İşlemi

```typescript
// OrderId ile iptal
const cancelResponse = await nestpay.cancelWithOrderId('12345');

// TransId ile iptal
const cancelWithTransId = await nestpay.cancelWithTransId('789');
```

### NestJS Usage

```typescript
import { Module } from '@nestjs/common';
import { NestPayService } from '@montarist/nestpay-api';

@Module({
	providers: [
		{
			provide: NestPayService,
			useValue: new NestPayService({
				clientId: 'YOUR_CLIENT_ID',
				username: 'YOUR_API_USERNAME',
				password: 'YOUR_API_PASSWORD',
				environment: 'TEST',
				bank: 'isbank',
			}),
		},
	],
	exports: [NestPayService],
})
export class PaymentModule {}
```

Then in your service:

```typescript
import { Injectable } from '@nestjs/common';
import { NestPayService, TransactionType, Currency } from '@montarist/nestpay-api';

@Injectable()
export class PaymentService {
	constructor(private readonly nestpayService: NestPayService) {}

	async processPayment(paymentDetails: any) {
		return this.nestpayService.processPayment({
			type: TransactionType.PAYMENT,
			amount: paymentDetails.amount,
			currency: Currency.TRY,
			orderId: paymentDetails.orderId,
			cardNumber: paymentDetails.cardNumber,
			expiryMonth: paymentDetails.expiryMonth,
			expiryYear: paymentDetails.expiryYear,
			cvv: paymentDetails.cvv,
			cardHolderName: paymentDetails.cardHolderName,
			// ... diğer alanlar
		});
	}

	async cancelPayment(orderId: string) {
		return this.nestpayService.cancelWithOrderId(orderId);
	}
}
```

## Desteklenen Bankalar

- İş Bankası
- Akbank
- Denizbank
- Halkbank
- Ziraat Bankası
- TEB
- QNB Finansbank
- Anadolubank

## Error Handling

The package includes comprehensive error handling. All methods return promises that may reject with specific error types. Always wrap your calls in try-catch blocks.

## License

MIT

## Support

For support, please create an issue on the GitHub repository.
