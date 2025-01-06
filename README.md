# @montarist/nestpay-api

NestPay (EST) payment gateway integration for Node.js and NestJS applications. This package provides a simple and type-safe way to integrate with Turkish banks using the NestPay (EST) payment gateway.

## Features

- TypeScript support with full type definitions
- Support for multiple Turkish banks (İş Bankası, Akbank, Denizbank, etc.)
- Easy to use API with Promise-based methods
- Comprehensive error handling
- Both Node.js and NestJS support

## Installation

```bash
npm install @montarist/nestpay-api
```

## Usage

### Basic Usage (Node.js)

```typescript
const {
  NestPayService,
  TransactionType,
  Currency,
} = require("@montarist/nestpay-api");

// Initialize the service
const nestpay = new NestPayService({
  clientId: "YOUR_CLIENT_ID",
  username: "YOUR_API_USERNAME",
  password: "YOUR_API_PASSWORD",
  environment: "TEST", // or 'PROD'
  bank: "isbank",
});

// Process a payment
async function processPayment() {
  try {
    const response = await nestpay.processPayment({
      type: TransactionType.PAYMENT,
      amount: 100.5,
      currency: Currency.TRY,
      orderId: "12345",
      cardNumber: "4444333322221111",
      expiryMonth: "12",
      expiryYear: "25",
      cvv: "123",
      cardHolderName: "John Doe",
    });

    console.log(response);
  } catch (error) {
    console.error(error);
  }
}
```

### NestJS Usage

```typescript
import { Module } from "@nestjs/common";
import { NestPayService } from "@montarist/nestpay-api";

@Module({
  providers: [
    {
      provide: NestPayService,
      useValue: new NestPayService({
        clientId: "YOUR_CLIENT_ID",
        username: "YOUR_API_USERNAME",
        password: "YOUR_API_PASSWORD",
        environment: "TEST",
        bank: "isbank",
      }),
    },
  ],
  exports: [NestPayService],
})
export class PaymentModule {}
```

Then in your service:

```typescript
import { Injectable } from "@nestjs/common";
import {
  NestPayService,
  TransactionType,
  Currency,
} from "@montarist/nestpay-api";

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
    });
  }
}
```

## API Documentation

### Configuration Options

```typescript
interface NestPayConfig {
  clientId: string; // Client ID provided by the bank
  username: string; // API Username
  password: string; // API Password
  storeKey?: string; // Store Key for 3D Secure
  environment: "TEST" | "PROD";
  bank:
    | "isbank"
    | "akbank"
    | "denizbank"
    | "halkbank"
    | "ziraatbank"
    | "teb"
    | "finansbank"
    | "anadolubank";
}
```

### Transaction Types

```typescript
enum TransactionType {
  AUTH = "Auth", // Authorization
  PREAUTH = "PreAuth", // Pre-authorization
  POSTAUTH = "PostAuth", // Post-authorization
  VOID = "Void", // Void
  REFUND = "Credit", // Refund
  INQUIRY = "Inquiry", // Transaction Inquiry
  PAYMENT = "Payment", // Direct Sale
  HISTORY = "History", // Transaction History
}
```

### Currencies

```typescript
enum Currency {
  TRY = "949", // Turkish Lira
  USD = "840", // US Dollar
  EUR = "978", // Euro
  GBP = "826", // British Pound
}
```

## Error Handling

The package includes comprehensive error handling. All methods return promises that may reject with specific error types. Always wrap your calls in try-catch blocks.

## License

MIT

## Support

For support, please create an issue on the GitHub repository.
