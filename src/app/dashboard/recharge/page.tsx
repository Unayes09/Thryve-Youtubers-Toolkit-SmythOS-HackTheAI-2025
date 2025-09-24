"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

type Pack = { id: string; credits: number; priceUsd: number; best?: boolean };

const PACKS: Pack[] = [
  { id: "pack_100", credits: 100, priceUsd: 5 },
  { id: "pack_500", credits: 500, priceUsd: 20, best: true },
  { id: "pack_1200", credits: 1200, priceUsd: 45 },
];

function PaymentForm({
  clientSecret,
  paymentIntentId,
  onCredited,
}: {
  clientSecret: string;
  paymentIntentId: string;
  onCredited: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });
      if (result.error) {
        console.error(result.error.message);
        return;
      }
      if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        const res = await fetch("/api/billing/credit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to credit user");
        }
        onCredited();
        router.push("/dashboard?checkout=success");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <Button
        className="w-full"
        onClick={handlePay}
        disabled={processing || !stripe}
      >
        <CreditCard className="mr-2 h-4 w-4" />{" "}
        {processing ? "Processing..." : "Pay now"}
      </Button>
    </div>
  );
}

export default function RechargePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as
    | string
    | undefined;
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  useEffect(() => {
    if (!selectedPack) return;
    let cancelled = false;
    const packId = selectedPack.id;
    async function createIntent() {
      setLoading(packId);
      const res = await fetch("/api/billing/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (!cancelled) {
        if (res.ok && data?.clientSecret) {
          setClientSecret(data.clientSecret);
          // Extract paymentIntentId from clientSecret: pi_..._secret_...
          const id = (data.clientSecret as string).split("_secret")[0];
          setPaymentIntentId(id);
        } else {
          console.error(data?.error || "Failed to create payment intent");
          setClientSecret(null);
          setPaymentIntentId(null);
        }
        setLoading(null);
      }
    }
    createIntent();
    return () => {
      cancelled = true;
    };
  }, [selectedPack]);

  return (
    <DashboardShell>
      <div className="py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold">Recharge Credits</h1>
          <p className="text-muted-foreground mt-2">
            Choose a credit pack and complete a secure payment to top up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKS.map((pack) => (
            <Card
              key={pack.id}
              className={pack.best ? "border-2 border-black" : ""}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{pack.credits} Credits</span>
                  {pack.best ? <Badge>Best value</Badge> : null}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">${pack.priceUsd}</div>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2">
                    <Check size={16} /> Instant credit top-up
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} /> Secure Stripe payment
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} /> No subscription required
                  </li>
                </ul>
                <Button
                  className="w-full"
                  disabled={loading === pack.id}
                  onClick={() => setSelectedPack(pack)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {loading === pack.id ? "Preparing..." : "Select"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPack && clientSecret && stripePromise ? (
          <div className="max-w-lg mx-auto mt-10">
            <Card>
              <CardHeader>
                <CardTitle>
                  Pay ${selectedPack.priceUsd} for {selectedPack.credits}{" "}
                  credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Elements options={{ clientSecret }} stripe={stripePromise}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    paymentIntentId={paymentIntentId!}
                    onCredited={() => {
                      setSelectedPack(null);
                      setClientSecret(null);
                      setPaymentIntentId(null);
                    }}
                  />
                </Elements>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Separator className="my-10" />
        <div className="text-center text-sm text-muted-foreground">
          Payments are processed by Stripe. Your credits will be added
          automatically after successful payment.
        </div>
      </div>
    </DashboardShell>
  );
}
