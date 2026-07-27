import { useState } from "react";
import { router } from "expo-router";
import RazorpayCheckout from "react-native-razorpay";

import AlertModal from "@/components/AlertModal";
import CustomButton from "@/components/CustomButton";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";

const humanize = (value: string) => value.replace(/_/g, " ");

// react-native-razorpay rejects checkout with { code, description }. On an actual
// payment failure (as opposed to the user backing out), `description` is a JSON string
// wrapping Razorpay's error body rather than a human-readable message.
const parseRazorpayError = (err: any): { title: string; message: string } => {
  const raw = err?.description;

  if (typeof raw === "string") {
    try {
      const details = JSON.parse(raw)?.error;
      if (details) {
        const description =
          details.description && details.description !== "undefined"
            ? details.description
            : undefined;
        const reason =
          details.reason && details.reason !== "undefined"
            ? humanize(details.reason)
            : undefined;

        return {
          title: "Payment Failed",
          message:
            description ??
            (reason
              ? `We couldn't process your payment (${reason}). Please try again.`
              : "We couldn't process your payment. Please try again."),
        };
      }
    } catch {
      // Not JSON - `raw` is already a plain message (e.g. user cancellation).
    }

    if (raw && raw !== "undefined") {
      return { title: "Payment cancelled", message: raw };
    }
  }

  return {
    title: "Payment cancelled",
    message: "The payment was not completed.",
  };
};

const Payment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const {
    userAddress,
    userLatitude,
    userLongitude,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const openPaymentSheet = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Create an order on the server
      const orderRes = await fetch("/(api)/razorpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok || !order.id) {
        throw new Error(order?.error ?? "Could not create order");
      }

      // 2. Open the Razorpay checkout
      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_PUBLISHABLE_KEY ?? "",
        order_id: order.id,
        amount: order.amount,
        currency: "INR",
        name: "Veloce",
        description: "Ride payment",
        prefill: { name: fullName, email, contact: "" },
        theme: { color: "#00FF1A" },
      };
      const data = await RazorpayCheckout.open(options);

      // 3. Verify the signature on the server
      const verifyRes = await fetch("/(api)/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        }),
      });
      const verify = await verifyRes.json();
      if (!verifyRes.ok || !verify.valid) {
        throw new Error("Payment could not be verified");
      }

      // 4. Save the ride
      const rideRes = await fetch("/(api)/ride/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_address: userAddress,
          destination_address: destinationAddress,
          origin_latitude: userLatitude,
          origin_longitude: userLongitude,
          destination_latitude: destinationLatitude,
          destination_longitude: destinationLongitude,
          ride_time: rideTime,
          fare_price: amount,
          payment_status: "paid",
          driver_id: driverId,
          user_email: email,
        }),
      });
      if (!rideRes.ok) {
        throw new Error("Payment succeeded but the ride could not be saved");
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      // Razorpay errors carry a `code`/`description`; anything else is our own flow error
      if (err?.code !== undefined) {
        setErrorAlert(parseRazorpayError(err));
      } else {
        setErrorAlert({
          title: "Error",
          message: err?.message ?? "Something went wrong.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomButton
        title={loading ? "Processing..." : "Confirm Ride"}
        onPress={openPaymentSheet}
        disabled={loading}
      />

      <AlertModal
        visible={showSuccessModal}
        type="success"
        title="Booking placed successfully"
        message="Thank you for your booking! Your reservation has been successfully placed. Please proceed with your trip."
        buttonText="Go Track"
        onClose={() => router.replace("/(root)/track-ride")}
        secondaryButtonText="Back Home"
        onSecondaryPress={() => router.replace("/(root)/(tabs)/home")}
      />

      <AlertModal
        visible={!!errorAlert}
        type="error"
        title={errorAlert?.title ?? "Error"}
        message={errorAlert?.message}
        onClose={() => setErrorAlert(null)}
      />
    </>
  );
};

export default Payment;
