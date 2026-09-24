export interface InitializePaymentParams {
  email: string;
  amountMinor: number;
  reference: string;
  callbackUrl?: string;
  subaccount?: string;
  platformFeeMinor?: number;
}

export interface InitializePaymentResult {
  authorization_url: string;
  access_code?: string;
  reference: string;
}

export interface VerifyPaymentResult {
  status: "success" | "failed" | "pending";
  reference: string;
  data?: any;
}

export interface CreateSubaccountParams {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge?: number;
}

export interface BankInfo {
  name: string;
  code: string;
  slug?: string;
}

export interface PaymentProvider {
  readonly providerName: string;
  initializeTransaction(params: InitializePaymentParams): Promise<InitializePaymentResult>;
  verifyTransaction(reference: string): Promise<VerifyPaymentResult>;
  createSubaccount(params: CreateSubaccountParams): Promise<{ subaccount_code: string; [key: string]: any }>;
  fetchBanks(): Promise<BankInfo[]>;
}
