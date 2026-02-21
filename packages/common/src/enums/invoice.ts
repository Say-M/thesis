export enum InvoiceStatus {
  PENDING = "Pending",
  PROCESSING = "Processing",
  SHIPPED = "Shipped",
  DELIVERED = "Delivered",
  CANCELLED = "Cancelled",
  REFUNDED = "Refunded",
}

export enum InvoiceType {
  ONLINE = "Online",
  OFFLINE = "Offline",
}

export enum TransactionStatus {
  PENDING = "Pending",
  SUCCESS = "Success",
  FAILED = "Failed",
}

export enum TransactionType {
  PAYMENT = "Payment",
  REFUND = "Refund",
}

export enum PaymentMethod {
  BKASH = "Bkash",
  NAGAD = "Nagad",
  ROCKET = "Rocket",
  CASH = "Cash",
  BANK_TRANSFER = "Bank Transfer",
  SSLCOMMERZ = "SSLCommerz",
  OTHER = "Other",
}

export enum PaymentType {
  ONLINE = "Online",
  COD = "Cash on Delivery",
}
