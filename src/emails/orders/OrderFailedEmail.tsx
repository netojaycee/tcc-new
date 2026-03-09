import { Section, Text, Link, Hr } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, buttonStyle } from "../BaseEmail";

interface OrderFailedEmailProps {
  firstName: string;
  orderNumber: string;
  orderId: string;
  reason?: string;
}

export default function OrderFailedEmail({
  firstName,
  orderNumber,
  orderId,
  reason,
}: OrderFailedEmailProps) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tcc-new.vercel.app";

  return (
    <EmailLayout preview={`Your order #${orderNumber} could not be fulfilled`}>
      <Text style={headingStyle}>We Have an Update on Your Order ⚠️</Text>

      <Text style={textStyle}>
        Hi {firstName},
      </Text>

      <Text style={textStyle}>
        We regret to inform you that your order #{orderNumber} could not be fulfilled. This typically happens due to:
      </Text>

      <Section style={{ margin: "20px 0", paddingLeft: "20px", borderLeft: "4px solid #ff6b6b" }}>
        <Text style={textStyle}>
          • Out of stock items<br />
          • Product changes or discontinuation<br />
          • Technical issues with production
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
          <Text style={{ ...textStyle, color: "#ff6b6b", fontWeight: "bold", margin: 0 }}>Failed</Text>
        </div>

        {reason && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <Text style={{ ...textStyle, margin: 0 }}>Reason:</Text>
            <Text style={{ ...textStyle, margin: 0 }}>{reason}</Text>
          </div>
        )}
      </Section>

      <Text style={textStyle}>
        Your payment has been refunded to your original payment method. Please allow 3-5 business days for the refund to appear in your account.
      </Text>

      <Hr style={{ margin: "30px 0" }} />

      <Text style={textStyle}>
        If you have any questions or would like to discuss alternative options, our support team is here to help.
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
