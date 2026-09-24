import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PaymentProvider } from "./payment-provider.interface.js";
import { PaystackAdapter } from "./paystack.adapter.js";

@Injectable()
export class PaymentRegistryService {
  private readonly logger = new Logger(PaymentRegistryService.name);
  private readonly providers = new Map<string, PaymentProvider>();

  constructor(private readonly paystackAdapter: PaystackAdapter) {
    // Register default payment providers
    this.registerProvider(this.paystackAdapter);
  }

  /**
   * Dynamically register a new payment gateway provider (e.g. Paystack, Flutterwave, Stripe)
   */
  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.providerName.toLowerCase(), provider);
    this.logger.log(`Registered payment provider: [${provider.providerName}]`);
  }

  /**
   * Get provider instance by gateway key (defaults to 'paystack' or DEFAULT_PAYMENT_GATEWAY env)
   */
  getProvider(gatewayName?: string): PaymentProvider {
    const activeGateway = (gatewayName || process.env.DEFAULT_PAYMENT_GATEWAY || "paystack").toLowerCase();
    const provider = this.providers.get(activeGateway);

    if (!provider) {
      throw new BadRequestException(`Payment provider '${activeGateway}' is not supported or configured.`);
    }

    return provider;
  }

  /**
   * List all registered active payment providers
   */
  listAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
