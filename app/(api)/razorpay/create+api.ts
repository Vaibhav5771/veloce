// Creates a Razorpay order server-side. Amount comes in as rupees; Razorpay wants paise.
export async function POST(request: Request) {
  try {
    const { amount } = await request.json();

    if (amount === undefined || amount === null) {
      return Response.json({ error: "Missing amount" }, { status: 400 });
    }

    const keyId = process.env.EXPO_PUBLIC_RAZORPAY_PUBLISHABLE_KEY;
    const keySecret = process.env.RAZORPAY_SECRET_KEY;

    if (!keyId || !keySecret) {
      return Response.json(
        { error: "Razorpay keys are not configured" },
        { status: 500 },
      );
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // rupees -> paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      }),
    });

    const order = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: order?.error?.description ?? "Failed to create order" },
        { status: 500 },
      );
    }

    return Response.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
