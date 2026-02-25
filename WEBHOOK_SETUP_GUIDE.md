# Webhook Setup Guide

This guide walks through setting up webhooks for Stripe and Printful to enable automatic order processing, payment handling, and email notifications.

## **Overview**

The webhook system automates the complete order-to-fulfillment workflow:

1. **Stripe Webhook** → Payment confirmation → Order marked as paid → Printful order created → Confirmation email sent
2. **Printful Webhook** → Order status updates → Order status synced → Status emails sent

## Prerequisites

- Stripe account and API keys
- Printful account and API credentials
- Application deployed with HTTPS (webhooks require secure URLs)
- `.env.local` file with webhook secrets

## Part 1: Setup Stripe Webhooks

### 1.1 Get Webhook Secret

1. Go to **[Stripe Dashboard](https://dashboard.stripe.com)**
2. Click **Developers** → **Webhooks** (in the left sidebar)
3. Click **Add an endpoint**
4. In the "Endpoint URL" field, enter your webhook URL:
   ```
   https://yourdomain.com/api/v1/webhooks
   ```
   - **Local testing**: Use ngrok to expose localhost (see Section 1.5 below)
   - **Production**: Use your actual deployed domain

5. Click **Select events** and choose these events:
   - ✅ `payment_intent.succeeded` (payment completed → order paid)
   - ✅ `payment_intent.payment_failed` (payment failed → order marked failed)
   - ✅ `charge.refunded` (optional, for refund tracking)

6. Click **Add endpoint**
7. A new endpoint will appear. In the **Signings secret** row, click **Reveal** to show the secret key
8. Copy this secret value

### 1.2 Add Stripe Webhook Secret to .env.local

Add to your `.env.local` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Restart your Next.js development server after adding environment variables.

### 1.3 Verify Webhook Integration

In the Stripe Dashboard, go to **Developers** → **Webhooks** → click your endpoint:

- **Recent events** tab shows all webhook attempts
- ✅ Green checkmarks = successful
- ❌ Red X marks = failed (see error details)

### 1.4 Testing in Production

Once deployed:

1. Process a test order through your checkout
2. Complete payment with [Stripe test card](https://stripe.com/docs/testing):
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

3. Verify in Stripe Dashboard:
   - Order status updates to "paid"
   - Confirmation email is sent
   - Printful order is created

### 1.5 Testing Locally with Stripe CLI

For local development, use the Stripe CLI to forward webhook events to localhost.

#### Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
choco install stripe-cli
```

**Linux:**
```bash
# See: https://stripe.com/docs/stripe-cli#install
```

#### Forward Webhooks to Local Server

1. Open a terminal and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/webhooks
   ```

2. This outputs a webhook signing secret:
   ```
   > Ready! Your webhook signing secret is whsec_test_xxxxxxxxxxxxx
   ```

3. Copy this secret to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
   ```

4. Restart your Next.js dev server

#### Trigger Test Events

In a new terminal, trigger webhook events:

```bash
# Payment succeeded (triggers order payment and Printful creation)
stripe trigger payment_intent.succeeded

# Payment failed
stripe trigger payment_intent.payment_failed

# Refund
stripe trigger charge.refunded
```

Watch your local server logs to see webhook processing.

---

## Part 2: Setup Printful Webhooks

### 2.1 Get API Access

1. Go to **[Printful Dashboard](https://dashboard.printful.com)**
2. Click your **Account** (profile icon, top right)
3. Select **API Settings**
4. If you haven't already, generate an API token:
   - Click **Generate new token**
   - Copy the token

5. Add to `.env.local`:
   ```env
   PRINTFUL_API_KEY=your-api-token-here
   ```

### 2.2 Add Webhook Endpoint

1. In Printful Dashboard, go to **Account** → **API Settings**
2. Scroll down to **Webhooks** section
3. Click **Add webhook**
4. In the "URL" field, enter:
   ```
   https://yourdomain.com/api/v1/webhooks/printful
   ```
   - **Local testing**: Use ngrok (same as Stripe CLI setup)

5. Select these events to enable:
   - ✅ `order:created` - When order is created in Printful
   - ✅ `order:updated` - When order details change
   - ✅ `order:shipped` - When order ships (sends tracking email)
   - ✅ `order:delivered` - When order is delivered (sends delivery email)
   - ✅ `order:failed` - When order fulfillment fails
   - ✅ `order:canceled` - When order is canceled

6. Click **Add webhook**

### 2.3 Testing Webhooks

Printful doesn't provide a CLI tool, but you can:

1. **Create a test order** through the normal checkout flow
2. Monitor the webhook delivery in Printful Dashboard:
   - Go to **Account** → **API Settings** → **Webhooks**
   - Click your webhook to see **Recent deliveries**
   - Green = successful, Red = failed

3. Watch server logs for webhook processing:
   - "Printful webhook event: order:created"
   - "Order marked as processing"
   - etc.

### 2.4 Manual Testing (For Development)

If you need to test without creating actual orders, you can:

1. **Use a webhook testing tool** like [Webhook.cool](https://webhook.cool) or [RequestBin](https://requestbin.com)
2. Intercept Printful webhooks and replay them to your local server
3. Or manually make POST requests to your webhook endpoint with sample payloads

Sample Printful webhook payload:

```json
{
  "type": "order:shipped",
  "data": {
    "id": 12345,
    "external_id": "ORD-12345",
    "status": "shipped",
    "tracking_number": "1Z999AA10123456784",
    "shipping_service": "FedEx",
    "estimated_delivery_date": "2025-03-15"
  }
}
```

---

## Part 3: Environment Variables Checklist

Ensure your `.env.local` has these values:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Printful Configuration
PRINTFUL_API_KEY=your-api-token-here

# Email Configuration (for sending transactional emails)
RESEND_API_KEY=re_xxxxxxxxxxxxx
# OR if using custom email service:
EMAIL_SERVICE_URL=https://your-email-service.com/send
EMAIL_FROM=noreply@pot-shop.com
EMAIL_API_KEY=your-email-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # For production, or http://localhost:3000 for dev
```

---

## Part 4: Webhook Traffic Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Customer Checkout                          │
├─────────────────────────────────────────────────────────────────┤
│  1. User fills cart & delivery address                            │
│  2. Clicks "Complete Order"                                       │
│  3. Creates Order (status: "pending")                             │
│  4. Creates Stripe PaymentIntent                                  │
│  5. Redirects to Stripe checkout                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  User Completes        │
            │  Stripe Payment        │
            └────────┬───────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ Stripe Webhook Triggered:      │
    │ payment_intent.succeeded       │
    │                                │
    │ 1. Mark order → "paid"         │
    │ 2. Send confirmation email     │
    │ 3. Create Printful order       │
    │ 4. Link Printful ID to order   │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌───────────────────────────────┐
    │ Printful Order in Production  │
    │ (printing, quality check, etc)│
    └─────────────┬─────────────────┘
                  │
                  ▼
    ┌──────────────────────────────┐
    │ Printful Webhook Triggered:  │
    │ order:shipped                │
    │                              │
    │ 1. Sync status → "shipped"   │
    │ 2. Send tracking email       │
    │ 3. Update DB with tracking   │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Order in Transit with Carrier│
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Printful Webhook Triggered:  │
    │ order:delivered              │
    │                              │
    │ 1. Sync status → "delivered" │
    │ 2. Send delivery email       │
    │ 3. Request review from user  │
    └──────────────┬───────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Order Complete ✓    │
        │ Customer satisfied! │
        └─────────────────────┘
```

---

## Part 5: Troubleshooting

### Webhooks Not Triggering

**Check 1: Endpoint URL is correct**
- Stripe Dashboard → Developers → Webhooks → click endpoint
- Verify the URL matches your application domain/port
- Example: `https://yourdomain.com/api/v1/webhooks`

**Check 2: Environment variables loaded**
```bash
# Verify your .env.local is being loaded
echo $STRIPE_WEBHOOK_SECRET
# Should print the secret, not empty
```

**Check 3: Server is running**
```bash
# Dev server:
npm run dev

# View logs for webhook processing:
# Should see: "Processing Stripe webhook event: payment_intent.succeeded"
```

**Check 4: Signature verification failing**
- Webhook status shows 400 errors
- Verify `STRIPE_WEBHOOK_SECRET` is copied exactly (no extra spaces)
- Check that you're using the correct secret (separate for test vs live mode)

### Emails Not Sending

**If Resend is configured:**
1. Verify `RESEND_API_KEY` is correct in `.env.local`
2. Check Resend dashboard for failed deliveries
3. Verify email addresses are valid

**If using custom email service:**
1. Verify `EMAIL_SERVICE_URL` is reachable
2. Check `EMAIL_API_KEY` and `EMAIL_FROM` are correct
3. Review server logs for HTTP errors

**General debugging:**
- Check server logs: `npm run dev` output shows email errors
- Printful/Stripe webhooks will still succeed even if email fails (by design)

### Printful Order Creation Fails

**Check server logs:**
```
Failed to create Printful order: [error message]
```

**Common issues:**
1. `PRINTFUL_API_KEY` not set or incorrect
2. Variant IDs invalid (product not properly synced from Printful)
3. Recipient address missing required fields
4. Printful API rate limiting (wait a few seconds and retry)

---

## Part 6: Email Notification Flow

Each webhook automatically triggers emails:

### Payment Success (Stripe Webhook)
- **Email**: OrderConfirmationEmail
- **To**: Customer email
- **Contains**: Order number, items summary, total, delivery address
- **CTA**: "Track Your Order" link to order tracking page

### Order Shipped (Printful Webhook)
- **Email**: OrderShippedEmail
- **To**: Customer email
- **Contains**: Tracking number, shipping carrier, estimated delivery
- **CTA**: "View Order Details" with tracking link

### Order Delivered (Printful Webhook)
- **Email**: OrderDeliveredEmail
- **To**: Customer email
- **Contains**: Delivery confirmation, order summary
- **CTA**: "Leave a Review" to collect customer feedback

All emails include POT Shop branding and footer with support links.

---

## Part 7: Production Deployment Checklist

Before going live with webhooks:

- [ ] Stripe webhook added to **Production** keys (not test keys)
- [ ] `STRIPE_WEBHOOK_SECRET` set to **production** secret
- [ ] Printful webhook URL points to production domain (HTTPS)
- [ ] Email service configured (Resend or custom)
- [ ] Test order processed end-to-end
- [ ] Confirmation email received
- [ ] Printful order created successfully
- [ ] Shipping email received when marked "shipped" on Printful
- [ ] Database correctly updates order statuses
- [ ] Monitor webhook logs in first 24 hours

---

## Support

If webhooks aren't working:

1. **Check Stripe Dashboard**: Developers → Webhooks → Recent events tab
2. **Check Printful Dashboard**: Account → API Settings → Recent deliveries
3. **Review server logs**: `npm run dev` output shows webhook processing
4. **Test with test cards**: Stripe test card `4242 4242 4242 4242`
5. **Use Stripe CLI locally**: `stripe listen` for local testing

For API issues, refer to:
- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Printful API Docs](https://developers.printful.com/)
