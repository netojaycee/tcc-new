import { render } from "@react-email/render";
import React from "react";

export interface EmailSendOptions {
  to: string;
  subject: string;
  component: React.ReactElement;
  replyTo?: string;
}

/**
 * Renders a React Email component to HTML
 */
export async function renderEmailComponent(component: React.ReactElement): Promise<string> {
  return await render(component);
}

/**
 * Sends an email using the configured email service
 * Currently supports Resend or custom SMTP
 *
 * @param options - Email options { to, subject, component, replyTo }
 * @returns Promise with email send result
 */
export async function sendEmail(options: EmailSendOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { to, subject, component, replyTo } = options;

  try {
    const html = await renderEmailComponent(component);

    // Check if using Resend (recommended for React Email)
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend({
        to,
        subject,
        html,
        replyTo,
      });
    }

    // Fallback to custom SMTP/API
    if (
      process.env.EMAIL_SERVICE_URL &&
      process.env.EMAIL_FROM &&
      process.env.EMAIL_API_KEY
    ) {
      return await sendViaCustomService({
        to,
        subject,
        html,
        replyTo,
      });
    }

    throw new Error(
      "No email service configured. Please set RESEND_API_KEY or EMAIL_SERVICE_URL"
    );
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Send email via Resend service
 * @link https://resend.com
 */
async function sendViaResend({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const from = `noreply-pot@${process.env.RESEND_DOMAIN}` || "noreply-pot@fevico.com.ng";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = (await response.json()) as { id: string };
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    throw new Error(
      `Resend send failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Send email via custom email service/SMTP
 */
async function sendViaCustomService({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const from = process.env.EMAIL_FROM || "noreply@fevico.com.ng";

  try {
    const response = await fetch(process.env.EMAIL_SERVICE_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Email service error: ${error}`);
    }

    const data = (await response.json()) as { id?: string; messageId?: string };
    return {
      success: true,
      messageId: data.id || data.messageId,
    };
  } catch (error) {
    throw new Error(
      `Email send failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Helper functions for specific email types
 */

export async function sendOrderConfirmationEmail({
  firstName,
  orderNumber,
  orderId,
  orderTotal,
  itemCount,
  deliveryAddress,
  customerEmail,
}: {
  firstName: string;
  orderNumber: string;
  orderId: string;
  orderTotal: number;
  itemCount: number;
  deliveryAddress: { street: string; city: string; state?: string; zip: string; country: string };
  customerEmail: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { default: OrderConfirmationEmail } = await import(
    "@/emails/orders/OrderConfirmationEmail"
  );

  return sendEmail({
    to: customerEmail,
    subject: `Order Confirmation - #${orderNumber}`,
    component: React.createElement(OrderConfirmationEmail, {
      firstName,
      orderNumber,
      orderId,
      orderTotal,
      itemCount,
      deliveryAddress,
    }),
  });
}

export async function sendOrderShippedEmail({
  firstName,
  orderNumber,
  orderId,
  trackingNumber,
  carrierName,
  estimatedDelivery,
  customerEmail,
}: {
  firstName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber: string;
  carrierName: string;
  estimatedDelivery: string;
  customerEmail: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { default: OrderShippedEmail } = await import(
    "@/emails/orders/OrderShippedEmail"
  );

  return sendEmail({
    to: customerEmail,
    subject: `Your Order Has Shipped! #${orderNumber}`,
    component: React.createElement(OrderShippedEmail, {
      firstName,
      orderNumber,
      orderId,
      trackingNumber,
      carrierName,
      estimatedDelivery,
    }),
  });
}

export async function sendOrderDeliveredEmail({
  firstName,
  orderNumber,
  orderId,
  customerEmail,
}: {
  firstName: string;
  orderNumber: string;
  orderId: string;
  customerEmail: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { default: OrderDeliveredEmail } = await import(
    "@/emails/orders/OrderDeliveredEmail"
  );

  return sendEmail({
    to: customerEmail,
    subject: `Order Delivered! #${orderNumber}`,
    component: React.createElement(OrderDeliveredEmail, {
      firstName,
      orderNumber,
      orderId,
    }),
  });
}
