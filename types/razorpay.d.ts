declare module "react-native-razorpay" {
  // Minimal surface of the checkout SDK: only what this app calls.
  export interface RazorpayCheckoutOptions {
    key: string;
    order_id: string;
    amount: number | string;
    currency: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
  }

  export interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  // Rejects with { code, description } rather than an Error.
  export interface RazorpayErrorResponse {
    code: number;
    description: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse>;
  };

  export default RazorpayCheckout;
}
