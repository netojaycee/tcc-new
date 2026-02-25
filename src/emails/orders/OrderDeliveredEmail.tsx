import { Section, Text, Link, Hr } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, buttonStyle } from "../BaseEmail";

interface OrderDeliveredEmailProps {
  firstName: string;
  orderNumber: string;
  orderId: string;
}

export default function OrderDeliveredEmail({
  firstName,
  orderNumber,
  orderId,
}: OrderDeliveredEmailProps) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

  return (
    <EmailLayout preview={`Your order #${orderNumber} has been delivered!`}>
      <Text style={headingStyle}>Your Order Has Arrived! 🎁</Text>

      <Text style={textStyle}>
        Hi {firstName},
      </Text>

      <Text style={textStyle}>
        Excellent news! Your order has been delivered. We hope you love what you ordered and that it brings joy!
      </Text>

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
          <Text style={{ ...textStyle, fontWeight: "bold", color: "#0D9488", margin: 0 }}>
            Delivered ✓
          </Text>
        </div>
      </Section>

      {/* Feedback Section */}
      <Text style={{ ...textStyle, fontSize: "14px", fontWeight: "bold", marginTop: "20px" }}>
        How was your experience?
      </Text>

      <Text style={textStyle}>
        We&apos;d love to hear your thoughts about your order! Your feedback helps us improve.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link href={`${APP_URL}/orders/${orderId}/review`} style={buttonStyle}>
          Leave a Review
        </Link>
      </Section>

      <Hr style={{ borderColor: "#e0e0e0", margin: "30px 0" }} />

      <Text style={{ ...textStyle, fontSize: "14px", marginTop: "20px" }}>
        <strong>What&apos;s Next?</strong>
        <br />
        • Browse our latest collections
        <br />
        • Share your photos on social media
        <br />
        • Explore personalized recommendations
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link href={APP_URL} style={buttonStyle}>
          Shop Again
        </Link>
      </Section>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666", marginTop: "20px" }}>
        If you have any issues with your order or need assistance, please{" "}
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
        Thank you for choosing Place of Treasure! 🛍️
        <br />
        The POT Team
      </Text>
    </EmailLayout>
  );
}
