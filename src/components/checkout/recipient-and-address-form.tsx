"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Phone,
  Mail,
  MapPin,
  Gift,
  ArrowLeft,
  Check,
} from "lucide-react";
import {
  checkoutFormSchema,
  type CheckoutFormInput,
} from "@/lib/schema/checkout.schema";
import { useCheckoutData } from "@/lib/hooks/use-checkout";
import { checkoutAction } from "@/lib/actions/order.actions";
import { calculateCheckoutCostsAction } from "@/lib/actions/cart.actions";

interface RecipientAndAddressFormProps {
  onOrderCreated: (orderId: string, clientSecret: string, order?: any) => void;
}

type FormData = CheckoutFormInput;

interface CostBreakdown {
  subtotal: number;
  tax: number;
  shipping: number;
  discountAmount: number;
  total: number;
  items: any[];
}

const OCCASIONS = [
  { value: "", label: "Select an occasion (optional)" },
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "wedding", label: "Wedding" },
  { value: "graduation", label: "Graduation" },
  { value: "congratulations", label: "Congratulations" },
  { value: "thank-you", label: "Thank You" },
  { value: "get-well", label: "Get Well" },
  { value: "sympathy", label: "Sympathy" },
  { value: "other", label: "Other" },
];

export function RecipientAndAddressForm({
  onOrderCreated,
}: RecipientAndAddressFormProps) {
  const checkoutData = useCheckoutData();
  const [isPending, setIsPending] = useState(false);
  const [step, setStep] = useState<"address" | "review">("address");
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(
    null,
  );
  const [formData, setFormData] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(checkoutFormSchema) as any,
    mode: "onChange",
    defaultValues: {
      email: checkoutData.email || "",
      firstName: checkoutData.firstName || "",
      lastName: checkoutData.lastName || "",
      phone: "",
      deliveryAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      occasion: "",
      specialMessage: "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsPending(true);

    try {
      // Step 1: Calculate costs based on address
      if (step === "address") {
        const costsResult = await calculateCheckoutCostsAction({
          street: data.deliveryAddress.street,
          city: data.deliveryAddress.city,
          state: data.deliveryAddress.state,
          zip: data.deliveryAddress.zip,
          country: data.deliveryAddress.country,
        });

        if (!costsResult.success) {
          toast.error(costsResult.error || "Failed to calculate costs");
          setIsPending(false);
          return;
        }

        // Store cost breakdown and form data
        setCostBreakdown((costsResult as any).data as CostBreakdown);
        setFormData(data);
        setStep("review");
        setIsPending(false);
        return;
      }

      // Step 2: Proceed to payment
      if (step === "review" && formData) {
        const payload = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          deliveryAddress: formData.deliveryAddress,
          occasion: formData.occasion || undefined,
          specialMessage: formData.specialMessage || undefined,
        };

        const result = await checkoutAction(payload);

        if (!result.success) {
          toast.error(result.error || "Failed to create order");
          setIsPending(false);
          return;
        }

        toast.success("Order created! Proceeding to payment...");
        if (result.data) {
          onOrderCreated(
            result.data.orderId,
            result.data.clientSecret,
            result.data.order,
          );
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred during checkout");
    } finally {
      setIsPending(false);
    }
  }

  // Loading state
  if (checkoutData.loading) {
    return (
      <div className="border bg-[#f5f5f5]">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </CardContent>
      </div>
    );
  }

  // Error state
  if (checkoutData.error) {
    return (
      <div className="border bg-[#f5f5f5]">
        <CardContent className="py-8">
          <p className="text-red-600">{checkoutData.error}</p>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`flex-1 h-2 rounded ${
            step === "address" ? "bg-teal-600" : "bg-gray-300"
          }`}
        />
        <div
          className={`flex-1 h-2 rounded ${
            step === "review" ? "bg-teal-600" : "bg-gray-300"
          }`}
        />
      </div>

      {/* Step 1: Address Form */}
      {step === "address" && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ============ RECIPIENT INFORMATION ============ */}
            <div className="border">
              <div className="border bg-[#f5f5f5] p-2">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Recipient Information
                </CardTitle>
              </div>
              <div className="space-y-4 p-4">
                {/* Email field - disabled for logged-in users */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          disabled={!!checkoutData.userId || isPending}
                          className="disabled:bg-gray-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* First and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Phone (Optional) */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ============ DELIVERY ADDRESS ============ */}
            <div className="border">
              <div className="border bg-[#f5f5f5] p-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </div>
              <div className="space-y-4 p-4">
                {/* Street Address */}
                <FormField
                  control={form.control}
                  name="deliveryAddress.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main Street"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City, State, ZIP */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryAddress.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="New York"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryAddress.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="NY"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryAddress.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="10001"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryAddress.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="United States"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* ============ GIFT OPTIONS (OPTIONAL) ============ */}
            <div className="border">
              <div className="border bg-[#f5f5f5] p-2">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Gift Options (Optional)
                </CardTitle>
              </div>
              <div className="space-y-4 p-4">
                {/* Occasion Dropdown */}
                <FormField
                  control={form.control}
                  name="occasion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occasion</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={isPending}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        >
                          {OCCASIONS.map((occasion) => (
                            <option key={occasion.value} value={occasion.value}>
                              {occasion.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Special Message Textarea */}
                <FormField
                  control={form.control}
                  name="specialMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Message</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Add a personal message (optional)"
                          {...field}
                          disabled={isPending}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Next Button - Calculate Costs */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-base h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Calculating costs...
                </>
              ) : (
                <>
                  <span>Review Costs</span>
                  <span>→</span>
                </>
              )}
            </Button>
          </form>
        </Form>
      )}

      {/* Step 2: Review Costs */}
      {step === "review" && costBreakdown && formData && (
        <div className="space-y-6">
          {/* Cost Summary Box */}
          <div className="border rounded-lg bg-linear-to-r from-teal-50 to-cyan-50 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Check className="h-5 w-5 text-teal-600" />
              Order Summary
            </h2>

            {/* Delivery Info */}
            <div className="mb-6 pb-6 border-b">
              <p className="text-sm text-gray-600 mb-2">Delivering to:</p>
              <p className="font-medium">
                {formData.firstName} {formData.lastName}
              </p>
              <p className="text-sm text-gray-700">
                {(costBreakdown as any).address ||
                  `${formData.deliveryAddress.street}, ${formData.deliveryAddress.city}, ${formData.deliveryAddress.state} ${formData.deliveryAddress.zip}, ${formData.deliveryAddress.country}`}
              </p>
            </div>

            {/* Items Count */}
            <div className="mb-6 pb-6 border-b">
              <p className="text-sm text-gray-600">Items in order:</p>
              <p className="text-xl font-semibold">
                {costBreakdown.items?.length || 0} item(s)
              </p>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 mb-6 pb-6 border-b">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-CA", {
                    style: "currency",
                    currency: "CAD",
                  }).format(costBreakdown.subtotal ?? 0)}
                </span>
              </div>

              {costBreakdown.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Discount</span>
                  <span className="font-medium text-green-600">
                    -{new Intl.NumberFormat("en-CA", {
                      style: "currency",
                      currency: "CAD",
                    }).format(costBreakdown.discountAmount ?? 0)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-700">Tax</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-CA", {
                    style: "currency",
                    currency: "CAD",
                  }).format(costBreakdown.tax ?? 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Shipping</span>
                <span className="font-medium">
                  {costBreakdown.shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    new Intl.NumberFormat("en-CA", {
                      style: "currency",
                      currency: "CAD",
                    }).format(costBreakdown.shipping ?? 0)
                  )}
                </span>
              </div>
            </div>

            {/* Final Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-teal-600">
                {new Intl.NumberFormat("en-CA", {
                  style: "currency",
                  currency: "CAD",
                }).format(costBreakdown.total ?? 0)}
              </span>
            </div>
          </div>

          {/* Edit / Proceed Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setStep("address");
                setCostBreakdown(null);
              }}
              className="flex-1 border-teal-300 text-teal-600 hover:bg-teal-50 h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Edit Address
            </Button>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white text-base h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>Proceed to Payment</span>
                      <span>→</span>
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
