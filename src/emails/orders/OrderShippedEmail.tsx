import { Section, Text, Link, Hr } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, buttonStyle, codeBoxStyle, codeStyle } from "../BaseEmail";

interface OrderShippedEmailProps {
  firstName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  carrierName?: string;
  estimatedDelivery?: string;
}

export default function OrderShippedEmail({
  firstName,
  orderNumber,
  orderId,
  trackingNumber,
  carrierName,
  estimatedDelivery,
}: OrderShippedEmailProps) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

  return (
    <EmailLayout preview={`Your order #${orderNumber} has shipped!`}>
      <Text style={headingStyle}>Your Order Has Shipped! 📦</Text>

      <Text style={textStyle}>
        Hi {firstName},
      </Text>

      <Text style={textStyle}>
        Great news! Your order has been shipped and is on its way to you. You can track your package using the details below.
      </Text>

      {/* Tracking Information */}
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
          Tracking Information
        </Text>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <Text style={{ ...textStyle, margin: 0 }}>Order Number:</Text>
          <Text style={{ ...textStyle, fontWeight: "bold", margin: 0 }}>{orderNumber}</Text>
        </div>

        {carrierName && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <Text style={{ ...textStyle, margin: 0 }}>Carrier:</Text>
            <Text style={{ ...textStyle, fontWeight: "bold", margin: 0 }}>{carrierName}</Text>
          </div>
        )}

        {trackingNumber && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <Text style={{ ...textStyle, margin: 0 }}>Tracking Number:</Text>
            <Text
              style={{
                ...textStyle,
                fontWeight: "bold",
                margin: 0,
                color: "#0D9488",
                fontFamily: "monospace",
              }}
            >
              {trackingNumber}
            </Text>
          </div>
        )}

        {estimatedDelivery && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <Text style={{ ...textStyle, margin: 0 }}>Est. Delivery:</Text>
            <Text style={{ ...textStyle, fontWeight: "bold", margin: 0 }}>{estimatedDelivery}</Text>
          </div>
        )}

        <Hr style={{ borderColor: "#e0e0e0", margin: "15px 0" }} />

        <Text style={{ ...textStyle, fontSize: "13px", color: "#666666" }}>
          {trackingNumber && (
            <>
              <strong>Tracking Number:</strong> {trackingNumber}
              <br />
            </>
          )}
          {carrierName && (
            <>
              <strong>Carrier:</strong> {carrierName}
              <br />
            </>
          )}
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link href={`${APP_URL}/orders/${orderId}`} style={buttonStyle}>
          View Order Details
        </Link>
      </Section>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        <strong>Tracking Tip:</strong> You can track your package using the tracking number and carrier information above. Most carriers provide real-time tracking updates.
      </Text>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666", marginTop: "20px" }}>
        If you have any questions, please{" "}
        <Link
          href={`${APP_URL}/contact`}
          style={{ color: "#0D9488", textDecoration: "none" }}
        >
          contact our support team
        </Link>
        .
      </Text>

      <Text
        style={{
          ...textStyle,
          fontSize: "13px",
          color: "#999999",
          marginTop: "30px",
          fontStyle: "italic",
        }}
      >
        We hope you enjoy your order! 🎁
        <br />
        The POT Team
      </Text>
    </EmailLayout>
  );
}
