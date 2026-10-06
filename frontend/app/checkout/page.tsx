"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Listing = {
  id: number;
  title: string;
  description: string;
  location: string;
  property_type: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
};

type Image = {
  id: number;
  image_url: string;
  display_order: number;
};

type ListingResponse = {
  listing: Listing;
  images: Image[];
};

const USER_ID = 3;

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const listingId = searchParams.get("listing_id");
  const checkIn = searchParams.get("check_in");
  const checkOut = searchParams.get("check_out");
  const guests = Number(searchParams.get("guests") || 1);

  const [listing, setListing] = useState<Listing | null>(null);
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<"upi" | "card" | "netbanking">("upi");

  const [upiId, setUpiId] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [showComingSoon, setShowComingSoon] =
    useState(false);

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [bookingId, setBookingId] =
    useState<number | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    fetch(
      `http://127.0.0.1:8000/listings/${listingId}`
    )
      .then((response) => response.json())
      .then((data: ListingResponse) => {
        setListing(data.listing);

        if (data.images && data.images.length > 0) {
          setImage(data.images[0].image_url);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Failed to load checkout listing:",
          error
        );

        setLoading(false);
      });
  }, [listingId]);

  function calculateNights() {
    if (!checkIn || !checkOut) {
      return 0;
    }

    const start = new Date(
      `${checkIn}T00:00:00`
    );

    const end = new Date(
      `${checkOut}T00:00:00`
    );

    const difference =
      end.getTime() - start.getTime();

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  }

  const nights = calculateNights();

  const nightlyTotal =
    listing && nights > 0
      ? listing.price_per_night * nights
      : 0;

  const cleaningFee =
    nights > 0
      ? 500
      : 0;

  const serviceFee =
    nights > 0
      ? nightlyTotal * 0.12
      : 0;

  const totalPrice =
    nightlyTotal +
    cleaningFee +
    serviceFee;

  async function handlePayment() {
    setErrorMessage("");

    if (paymentMethod !== "upi") {
      setShowComingSoon(true);
      return;
    }

    if (!upiId.trim()) {
      setErrorMessage(
        "Please enter your UPI ID."
      );
      return;
    }

    if (!upiId.includes("@")) {
      setErrorMessage(
        "Please enter a valid UPI ID, for example name@upi."
      );
      return;
    }

    if (
      !listingId ||
      !checkIn ||
      !checkOut ||
      nights <= 0
    ) {
      setErrorMessage(
        "Invalid booking details. Please return to the listing and try again."
      );
      return;
    }

    setPaymentLoading(true);

    /*
     * MOCK PAYMENT
     *
     * We wait for 2 seconds to simulate
     * payment processing.
     */
    await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );

    try {
      /*
       * IMPORTANT:
       * Booking is created ONLY after the
       * mock payment succeeds.
       */
      const bookingUrl =
        `http://127.0.0.1:8000/bookings/` +
        `?listing_id=${listingId}` +
        `&guest_id=${USER_ID}` +
        `&check_in=${checkIn}` +
        `&check_out=${checkOut}` +
        `&guests=${guests}`;

      const bookingResponse =
        await fetch(bookingUrl, {
          method: "POST",
        });

      const bookingData =
        await bookingResponse.json();

      if (!bookingResponse.ok) {
        setErrorMessage(
          bookingData.detail ||
            "Booking could not be completed. The dates may no longer be available."
        );

        setPaymentLoading(false);
        return;
      }

      setBookingId(bookingData.id);
      setShowSuccess(true);
    } catch (error) {
      console.error(
        "Booking after payment failed:",
        error
      );

      setErrorMessage(
        "Payment was simulated, but the booking could not be completed. Please try again."
      );
    }

    setPaymentLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p>Loading checkout...</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-2xl font-semibold">
            Checkout unavailable
          </h1>

          <p className="mt-3 text-gray-500">
            We couldn't load the booking details.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 cursor-pointer rounded-lg bg-black px-5 py-3 text-white"
          >
            Back to explore
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <nav className="border-b px-8 py-5">

        <button
          onClick={() => router.push("/")}
          className="cursor-pointer text-2xl font-bold text-red-500 transition hover:opacity-80"
        >
          airbnb
        </button>

      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">

        {/* Header */}
        <div className="mb-8">

          <button
            onClick={() => router.back()}
            className="cursor-pointer text-sm font-semibold hover:underline"
          >
            ← Back
          </button>

          <h1 className="mt-5 text-3xl font-semibold">
            Confirm and pay
          </h1>

        </div>

        <div className="grid gap-10 lg:grid-cols-5">

          {/* Left side */}
          <section className="space-y-8 lg:col-span-3">

            {/* Trip details */}
            <div>

              <h2 className="text-xl font-semibold">
                Your trip
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-5 rounded-xl border p-5">

                <div>
                  <p className="text-xs font-semibold uppercase">
                    Dates
                  </p>

                  <p className="mt-2 text-sm">
                    {checkIn}
                    {" → "}
                    {checkOut}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase">
                    Guests
                  </p>

                  <p className="mt-2 text-sm">
                    {guests}{" "}
                    {guests === 1
                      ? "guest"
                      : "guests"}
                  </p>
                </div>

              </div>

            </div>

            {/* Payment */}
            <div>

              <h2 className="text-xl font-semibold">
                Choose how to pay
              </h2>

              <div className="mt-5 overflow-hidden rounded-xl border">

                {/* UPI */}
                <button
                  onClick={() =>
                    setPaymentMethod("upi")
                  }
                  className={`flex w-full cursor-pointer items-center justify-between border-b p-5 text-left transition ${
                    paymentMethod === "upi"
                      ? "bg-gray-50"
                      : "hover:bg-gray-50"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl">
                      📱
                    </div>

                    <div>
                      <p className="font-semibold">
                        UPI
                      </p>

                      <p className="text-sm text-gray-500">
                        Pay using UPI
                      </p>
                    </div>

                  </div>

                  <span>
                    {paymentMethod === "upi"
                      ? "●"
                      : "○"}
                  </span>

                </button>

                {/* Card */}
                <button
                  onClick={() => {
                    setPaymentMethod("card");
                    setShowComingSoon(true);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between border-b p-5 text-left transition hover:bg-gray-50"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl">
                      💳
                    </div>

                    <div>
                      <p className="font-semibold">
                        Credit or debit card
                      </p>

                      <p className="text-sm text-gray-500">
                        Card payments are coming soon
                      </p>
                    </div>

                  </div>

                  <span>
                    →
                  </span>

                </button>

                {/* Net Banking */}
                <button
                  onClick={() => {
                    setPaymentMethod("netbanking");
                    setShowComingSoon(true);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between p-5 text-left transition hover:bg-gray-50"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl">
                      🏦
                    </div>

                    <div>
                      <p className="font-semibold">
                        Net Banking
                      </p>

                      <p className="text-sm text-gray-500">
                        Net Banking is coming soon
                      </p>
                    </div>

                  </div>

                  <span>
                    →
                  </span>

                </button>

              </div>

              {/* UPI form */}
              {paymentMethod === "upi" && (
                <div className="mt-5 rounded-xl border p-5">

                  <h3 className="font-semibold">
                    Enter your UPI ID
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    This is a simulated payment. No
                    real money will be charged.
                  </p>

                  <input
                    type="text"
                    value={upiId}
                    onChange={(event) =>
                      setUpiId(event.target.value)
                    }
                    placeholder="yourname@upi"
                    className="mt-4 w-full rounded-lg border p-3 outline-none focus:border-black"
                  />

                  {errorMessage && (
                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="mt-5 w-full cursor-pointer rounded-lg bg-red-500 py-4 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paymentLoading
                      ? "Processing payment..."
                      : `Pay ₹${Math.round(
                          totalPrice
                        ).toLocaleString()}`}
                  </button>

                  <p className="mt-3 text-center text-xs text-gray-500">
                    🔒 Secure simulated payment
                  </p>

                </div>
              )}

            </div>

          </section>

          {/* Right side - Summary */}
          <aside className="h-fit rounded-2xl border p-6 shadow-lg lg:col-span-2">

            <div className="flex gap-4">

              <img
                src={image || "/placeholder.jpg"}
                alt={listing.title}
                className="h-24 w-24 rounded-xl object-cover"
              />

              <div>

                <h2 className="font-semibold">
                  {listing.title}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {listing.location}
                </p>

                <p className="mt-2 text-sm">
                  ★ 4.8
                </p>

              </div>

            </div>

            <hr className="my-6" />

            <h2 className="text-lg font-semibold">
              Price details
            </h2>

            <div className="mt-5 space-y-4 text-sm">

              <div className="flex justify-between">

                <span>
                  ₹
                  {listing.price_per_night.toLocaleString()}
                  {" × "}
                  {nights}{" "}
                  {nights === 1
                    ? "night"
                    : "nights"}
                </span>

                <span>
                  ₹{nightlyTotal.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between">

                <span>
                  Cleaning fee
                </span>

                <span>
                  ₹{cleaningFee.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between">

                <span>
                  Service fee
                </span>

                <span>
                  ₹
                  {Math.round(
                    serviceFee
                  ).toLocaleString()}
                </span>

              </div>

            </div>

            <hr className="my-5" />

            <div className="flex justify-between text-lg font-semibold">

              <span>
                Total
              </span>

              <span>
                ₹
                {Math.round(
                  totalPrice
                ).toLocaleString()}
              </span>

            </div>

            <p className="mt-4 text-xs text-gray-500">
              Your payment is simulated for this
              assignment. No real transaction will
              take place.
            </p>

          </aside>

        </div>

      </div>

      {/* Payment Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-semibold">
              Booking confirmed!
            </h2>

            <p className="mt-2 text-gray-500">
              Your simulated UPI payment was
              successful and your stay is confirmed.
            </p>

            <div className="mt-6 rounded-xl bg-gray-50 p-5 text-left">

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Reservation ID
                </span>

                <span className="font-semibold">
                  #{bookingId}
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-gray-500">
                  Dates
                </span>

                <span className="font-medium">
                  {checkIn} → {checkOut}
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="text-gray-500">
                  Guests
                </span>

                <span className="font-medium">
                  {guests}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t pt-3">
                <span className="font-semibold">
                  Total paid
                </span>

                <span className="font-semibold">
                  ₹
                  {Math.round(
                    totalPrice
                  ).toLocaleString()}
                </span>
              </div>

            </div>

            <button
              onClick={() => router.push("/trips")}
              className="mt-6 w-full cursor-pointer rounded-lg bg-black py-3 font-semibold text-white hover:bg-gray-800"
            >
              View my trips
            </button>

            <button
              onClick={() => router.push("/")}
              className="mt-3 w-full cursor-pointer rounded-lg border py-3 font-semibold hover:bg-gray-50"
            >
              Back to explore
            </button>

          </div>

        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowComingSoon(false);
            setPaymentMethod("upi");
          }}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="text-5xl">
              🚧
            </div>

            <h2 className="mt-4 text-2xl font-semibold">
              Coming Soon
            </h2>

            <p className="mt-3 text-gray-500">
              This payment method is currently under
              development and will be available soon.
            </p>

            <button
              onClick={() => {
                setShowComingSoon(false);
                setPaymentMethod("upi");
              }}
              className="mt-6 cursor-pointer rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Use UPI instead
            </button>

          </div>

        </div>
      )}

    </main>
  );
}