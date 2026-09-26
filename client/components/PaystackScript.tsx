import Script from "next/script";

/**
 * Loads the Paystack inline v2 script.
 * The script itself sets an `allow` attribute (`payment; clipboard-read; clipboard-write`).
 * Adding the same `allow` value here prevents the SDK from logging the warning about
 * `allow` taking precedence over `allowPaymentRequest`.
 */
export default function PaystackScript() {
  return (
    <Script
      src="https://js.paystack.co/v2/inline.js"
      strategy="lazyOnload"
      // Explicitly match the attribute the SDK applies internally.
      allow="payment; clipboard-read; clipboard-write"
    />
  );
}
