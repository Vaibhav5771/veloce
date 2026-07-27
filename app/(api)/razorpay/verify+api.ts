import crypto from "crypto";

// Verifies the payment signature: HMAC_SHA256(order_id|payment_id, key_secret) must equal razorpay_signature.
export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const keySecret = process.env.RAZORPAY_SECRET_KEY;
    if (!keySecret) {
      return Response.json(
        { error: "Razorpay secret is not configured" },
        { status: 500 },
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const valid = expectedSignature === razorpay_signature;

    return Response.json({ valid }, { status: valid ? 200 : 400 });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
