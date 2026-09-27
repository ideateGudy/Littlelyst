import Script from "next/script";

/**
 * Loads the Paystack inline v2 script.
 */
export default function PaystackScript() {
  return (
    <Script
      src="https://js.paystack.co/v2/inline.js"
      strategy="lazyOnload"
    />
  );
}
