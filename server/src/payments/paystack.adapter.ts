import { Injectable, Logger } from "@nestjs/common";
import {
  PaymentProvider,
  InitializePaymentParams,
  InitializePaymentResult,
  VerifyPaymentResult,
  CreateSubaccountParams,
  BankInfo,
} from "./payment-provider.interface.js";

@Injectable()
export class PaystackAdapter implements PaymentProvider {
  readonly providerName = "paystack";
  private readonly logger = new Logger(PaystackAdapter.name);

  private get secretKey(): string {
    return process.env.PAYSTACK_SECRET_KEY || "";
  }

  private get baseUrl(): string {
    return "https://api.paystack.co";
  }

  /**
   * Helper method for Paystack HTTP API requests
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok || data.status === false) {
      this.logger.error(`Paystack API error [${endpoint}]:`, data);
      throw new Error(data.message || `Paystack request failed with status ${response.status}`);
    }

    return data;
  }

  /**
   * Initialize Paystack transaction for checkout
   */
  async initializeTransaction(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    const payload: Record<string, any> = {
      email: params.email,
      amount: params.amountMinor,
      reference: params.reference,
      channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft"],
    };

    if (params.callbackUrl) payload.callback_url = params.callbackUrl;
    if (params.subaccount) {
      payload.subaccount = params.subaccount;
      if (params.platformFeeMinor !== undefined) {
        payload.transaction_fee = params.platformFeeMinor;
      }
    }

    const res = await this.request<{
      status: boolean;
      message: string;
      data: { authorization_url: string; access_code: string; reference: string };
    }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      authorization_url: res.data.authorization_url,
      access_code: res.data.access_code,
      reference: res.data.reference,
    };
  }

  /**
   * Verify Paystack transaction by reference
   */
  async verifyTransaction(reference: string): Promise<VerifyPaymentResult> {
    const res = await this.request<{ status: boolean; message: string; data: any }>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      { method: "GET" },
    );

    const isSuccess = res.data && res.data.status === "success";
    return {
      status: isSuccess ? "success" : "pending",
      reference: res.data?.reference || reference,
      data: res.data,
    };
  }

  /**
   * Create seller subaccount for split payment settlements
   */
  async createSubaccount(params: CreateSubaccountParams): Promise<{ subaccount_code: string; [key: string]: any }> {
    const payload = {
      business_name: params.businessName,
      bank_code: params.bankCode,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge ?? 5,
    };

    const res = await this.request<{
      status: boolean;
      message: string;
      data: { subaccount_code: string; [key: string]: any };
    }>("/subaccount", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return res.data;
  }

  /**
   * Fetch list of supported Nigerian banks for payout account configuration
   */
  async fetchBanks(): Promise<BankInfo[]> {
    const res = await this.request<{
      status: boolean;
      message: string;
      data: Array<{ name: string; code: string; slug: string }>;
    }>("/bank?country=nigeria", { method: "GET" });

    return (res.data || []).map((b) => ({
      name: b.name,
      code: b.code,
      slug: b.slug,
    }));
  }
}
