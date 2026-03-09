import { Section, Text, Link, Hr } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, buttonStyle } from "../BaseEmail";

interface OrderCanceledEmailProps {
  firstName: string;
  orderNumber: string;
  orderId: string;
  reason?: string;
}

export default function OrderCanceledEmail({
  firstName,
  orderNumber,
  orderId,
  reason,
}: OrderCanceledEmailProps) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tcc-new.vercel.app";

  return (
    <EmailLayout preview={`Your order #${orderNumber} has been canceled`}>
      <Text style={headingStyle}>Order Canceled 🔔</Text>

      <Text style={textStyle}>
        Hi {firstName},
      </Text>

      <Text style={textStyle}>
        Your order #{orderNumber} has been canceled. This may have occurred due to:
      </Text>

      <Section style={{ margin: "20px 0", paddingLeft: "20px", borderLeft: "4px solid #ffa94d" }}>
        <Text style={textStyle}>
          • Cancellation request<br />
          • Payment issues<br />
          • Inventory unavailability<br />
          • Fulfillment complications
        </Text>
      </Section>

      {/* Order Summary */}
      <Section
        style={{
          backgroundColor: "#f9f9f9",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          margin: "20px 0",
        }}
      >
        <Text style={{ ...textStyle, fontWeight: "bold", marginBottom: "15px" }}>
          Order Summary
        </Text>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <Text style={{ ...textStyle, margin: 0 }}>Order Number:</Text>
          <Text style={{ ...textStyle, fontWeight: "bold", margin: 0 }}>{orderNumber}</Text>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <Text style={{ ...textStyle, margin: 0 }}>Status:</Text>
          <Text style={{ ...textStyle, color: "#ffa94d", fontWeight: "bold", margin: 0 }}>Canceled</Text>
        </div>

        {reason && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <Text style={{ ...textStyle, margin: 0 }}>Reason:</Text>
            <Text style={{ ...textStyle, margin: 0 }}>{reason}</Text>
          </div>
        )}
      </Section>

      <Text style={textStyle}>
        If a payment was processed, a refund will be issued to your original payment method. Please allow 3-5 business days for the refund to appear in your account.
      </Text>

      <Hr style={{ margin: "30px 0" }} />

      <Text style={textStyle}>
        If you believe this is a mistake or have questions about your cancellation, our support team is ready to help.
      </Text>

      {/* Support Button */}
      <Section style={{ textAlign: "center" as const, margin: "30px 0" }}>
        <Link
          href={`${APP_URL}/contact`}
          style={buttonStyle}
        >
          Contact Support
        </Link>
      </Section>

      <Hr style={{ margin: "30px 0" }} />

      <Text style={{ ...textStyle, fontSize: "12px", color: "#999" }}>
        Order ID: {orderId}
      </Text>
    </EmailLayout>
  );
}
