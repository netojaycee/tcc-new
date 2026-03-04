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
import { CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Phone, Mail, MapPin } from "lucide-react";
import {
  checkoutFormSchema,
  type CheckoutFormInput,
} from "@/lib/schema/checkout.schema";
import { useCheckoutData } from "@/lib/hooks/use-checkout";
import { useCountries, useStatesByCountry } from "@/lib/hooks/use-countries";
import { useCurrency } from "@/lib/context/currency.context";
import { checkoutUnifiedAction } from "@/lib/actions/checkout-unified.actions";

interface RecipientAndAddressFormProps {
  onOrderCreated: (
    draftOrderId: string,
    clientSecret: string,
    orderData: any
  ) => void;
}

type FormData = CheckoutFormInput;

export function RecipientAndAddressForm({
  onOrderCreated,
}: RecipientAndAddressFormProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  
  const checkoutData = useCheckoutData();
  const { countries, isLoadingCountries } = useCountries();
  const { states, isLoadingStates } = useStatesByCountry(
    selectedCountry || null
  );
  const { currency, exchangeRate } = useCurrency();

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
    },
  });

  async function onSubmit(data: FormData) {
    setIsPending(true);

    try {
      // Call checkoutUnifiedAction - this creates draft order AND payment intent
      // Pass currency and exchangeRate so server can convert costs from CAD to user's currency
      const result = await checkoutUnifiedAction({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        deliveryAddress: data.deliveryAddress,
        currency,    // User's current currency (USD, GBP, etc)
        exchangeRate, // Exchange rate from CAD to user's currency
      });

      if (!result.success) {
        toast.error(result.error || "Failed to process checkout");
        return;
      }

      if (!result.data) {
        toast.error("Invalid response from server");
        return;
      }

      // Call parent handler with order data
      toast.success("Address confirmed! Proceeding to payment...");
      onOrderCreated(
        (result.data as any).orderNumber.toString().toLowerCase(),
        result.data.clientSecret,
        result.data
      );
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
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (checkoutData.error) {
    return (
      <div className="border bg-[#f5f5f5]">
        <div className="py-8">
          <p className="text-red-600">{checkoutData.error}</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ============ RECIPIENT INFORMATION ============ */}
        <div className="border">
          <div className="border bg-[#f5f5f5] p-3">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recipient Information
            </CardTitle>
          </div>
          <div className="space-y-4 p-4">
            {/* Email field */}
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
                      disabled={isPending}
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
          <div className="border bg-[#f5f5f5] p-3">
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

            {/* Country and City */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deliveryAddress.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isPending || isLoadingCountries}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCountry(value);
                          form.setValue("deliveryAddress.state", "");
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              isLoadingCountries
                                ? "Loading countries..."
                                : "Select country"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryAddress.state"
                render={({ field }) => {
                  const selectedCountryObj = countries.find(
                    (c) => c.code === selectedCountry
                  );
                  const hasStates =
                    selectedCountryObj?.states &&
                    selectedCountryObj.states.length > 0;
                  const isRequired = selectedCountry && hasStates;

                  return (
                    <FormItem>
                      <FormLabel>
                        State {isRequired ? "*" : "(Optional)"}
                      </FormLabel>
                      <FormControl>
                        {hasStates ? (
                          <Select
                            disabled={
                              isPending || isLoadingStates || !selectedCountry
                            }
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={
                                  !selectedCountry
                                    ? "Select country first"
                                    : isLoadingStates
                                      ? "Loading states..."
                                      : "Select state"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.code} value={state.code}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Not applicable for this country"
                            {...field}
                            disabled={true}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* City and ZIP */}
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
            </div>
          </div>
        </div>

        {/* Proceed to Payment Button */}
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
  );
}
