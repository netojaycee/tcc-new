import { Section, Text, Link, Hr } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import {
  headingStyle,
  textStyle,
  buttonStyle,
  codeBoxStyle,
  codeStyle,
} from "../BaseEmail";

interface OrderConfirmationEmailProps {
  firstName: string;
  orderNumber: string;
  orderId: string;
  orderTotal: number;
  itemCount: number;
  deliveryAddress: {
    street: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
  };
}

export default function OrderConfirmationEmail({
  firstName,
  orderNumber,
  orderId,
  orderTotal,
  itemCount,
  deliveryAddress,
}: OrderConfirmationEmailProps) {
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

  return (
    <EmailLayout preview={`Your order #${orderNumber} has been confirmed`}>
      <Text style={headingStyle}>Order Confirmed! 🎉</Text>

      <Text style={textStyle}>Hi {firstName},</Text>

      <Text style={textStyle}>
        Thank you for your order! We&apos;ve received your payment and your
        order is being prepared for shipment.
      </Text>

      {/* Order Summary Box */}
      <Section
        style={{
          backgroundColor: "#f9f9f9",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          margin: "20px 0",
        }}
      >
        <Text
          style={{ ...textStyle, fontWeight: "bold", marginBottom: "15px" }}
        >
          Order Details
        </Text>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <Text style={{ ...textStyle, margin: 0 }}>Order Number:</Text>
          <Text style={{ ...textStyle, fontWeight: "bold", margin: 0 }}>
            {orderNumber}
          </Text>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <Text style={{ ...textStyle, margin: 0 }}>Items:</Text>
          <Text style={{ ...textStyle, fontWeight: "bold", margin: 0 }}>
            {itemCount}
          </Text>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <Text style={{ ...textStyle, margin: 0 }}>Order Total:</Text>
          <Text
            style={{
              ...textStyle,
              fontWeight: "bold",
              color: "#0D9488",
              margin: 0,
            }}
          >
            CAD {orderTotal.toFixed(2)}
          </Text>
        </div>

        <Hr style={{ borderColor: "#e0e0e0", margin: "15px 0" }} />

        <Text
          style={{
            ...textStyle,
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Delivery Address:
        </Text>
        <Text style={{ ...textStyle, fontSize: "14px", margin: "5px 0" }}>
          {deliveryAddress.street}
        </Text>
        <Text style={{ ...textStyle, fontSize: "14px", margin: "5px 0" }}>
          {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zip}
        </Text>
        <Text style={{ ...textStyle, fontSize: "14px", margin: "5px 0" }}>
          {deliveryAddress.country}
        </Text>
      </Section>

      <Text style={textStyle}>
        Your order is now being processed and will be shipped shortly.
        You&apos;ll receive a tracking number via email as soon as it ships.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link href={`${APP_URL}/orders/${orderId}`} style={buttonStyle}>
          Track Your Order
        </Link>
      </Section>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        If you have any questions about your order, please{" "}
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
        Thank you for shopping with Place of Treasure! 🛍️
        <br />
        The POT Team
      </Text>
    </EmailLayout>
  );
}
