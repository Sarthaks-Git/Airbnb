"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Booking = {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  nightly_price: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: string;
};

type Listing = {
  id: number;
  title: string;
  location: string;
  price_per_night: number;
  image_url: string | null;
};

export default function TripsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Record<number, Listing>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      try {
        // Mock logged-in guest
        const bookingResponse = await fetch(
          "http://127.0.0.1:8000/bookings/my-trips?guest_id=3"
        );

        const bookingData = await bookingResponse.json();

        setBookings(bookingData);

        // Get listing information for each booking
        const listingResults = await Promise.all(
          bookingData.map(async (booking: Booking) => {
            const response = await fetch(
              `http://127.0.0.1:8000/listings/${booking.listing_id}`
            );

            const data = await response.json();

            return data.listing;
          })
        );

        const listingMap: Record<number, Listing> = {};

        listingResults.forEach((listing: Listing) => {
          if (listing) {
            listingMap[listing.id] = listing;
          }
        });

        setListings(listingMap);
      } catch (error) {
        console.error("Failed to load trips:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8">
        <p className="text-gray-500">
          Loading your trips...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <nav className="flex items-center justify-between border-b px-8 py-5">

        {/* Airbnb Logo */}
        <Link
          href="/"
          className="cursor-pointer text-2xl font-bold text-red-500 transition hover:opacity-80"
        >
          airbnb
        </Link>

        <div className="flex items-center gap-6 text-sm">

          <Link
            href="/trips"
            className="cursor-pointer font-semibold hover:underline"
          >
            Trips
          </Link>

          <button
            className="cursor-pointer hover:underline"
          >
            Airbnb your home
          </button>

          <button
            className="cursor-pointer"
            aria-label="Language"
          >
            🌐
          </button>

          <button
            className="cursor-pointer"
            aria-label="Menu"
          >
            ☰
          </button>

        </div>

      </nav>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-6 py-10">

        {/* Back to explore */}
        <Link
          href="/"
          className="cursor-pointer text-sm font-semibold hover:underline"
        >
          ← Back to explore
        </Link>

        <h1 className="mt-6 text-3xl font-semibold">
          My Trips
        </h1>

        <p className="mt-2 text-gray-500">
          Your upcoming and previous stays
        </p>

        {bookings.length === 0 ? (

          /* Empty state */
          <div className="mt-10 rounded-xl border p-10 text-center">

            <h2 className="text-xl font-semibold">
              No trips yet
            </h2>

            <p className="mt-2 text-gray-500">
              Start exploring stays and book your next trip.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block cursor-pointer rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Explore stays
            </Link>

          </div>

        ) : (

          /* Trips */
          <div className="mt-8 space-y-6">

            {bookings.map((booking) => {

              const listing = listings[booking.listing_id];

              return (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md"
                >

                  <div className="grid md:grid-cols-3">

                    {/* Image */}
                    <div className="h-64 md:h-full">

                      {listing?.image_url ? (

                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                          No image
                        </div>

                      )}

                    </div>

                    {/* Details */}
                    <div className="p-6 md:col-span-2">

                      <div className="flex items-start justify-between">

                        <div>

                          <h2 className="text-xl font-semibold">
                            {listing?.title ||
                              `Listing #${booking.listing_id}`}
                          </h2>

                          <p className="mt-1 text-gray-500">
                            {listing?.location ||
                              "Location unavailable"}
                          </p>

                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                          {booking.status}
                        </span>

                      </div>

                      <hr className="my-5" />

                      {/* Booking information */}
                      <div className="grid grid-cols-2 gap-5">

                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            CHECK-IN
                          </p>

                          <p className="mt-1 font-medium">
                            {formatDate(booking.check_in)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            CHECK-OUT
                          </p>

                          <p className="mt-1 font-medium">
                            {formatDate(booking.check_out)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            GUESTS
                          </p>

                          <p className="mt-1 font-medium">
                            {booking.guests}{" "}
                            {booking.guests === 1
                              ? "guest"
                              : "guests"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500">
                            NIGHTS
                          </p>

                          <p className="mt-1 font-medium">
                            {booking.nights}
                          </p>
                        </div>

                      </div>

                      <hr className="my-5" />

                      {/* Total */}
                      <div className="flex items-center justify-between">

                        <div>

                          <p className="text-sm text-gray-500">
                            Total paid
                          </p>

                          <p className="text-xl font-semibold">
                            ₹{booking.total_price.toLocaleString()}
                          </p>

                        </div>

                        {/* Open listing in new tab */}
                        <button
                          onClick={() =>
                            window.open(
                              `/listings/${booking.listing_id}`,
                              "_blank"
                            )
                          }
                          className="cursor-pointer rounded-lg border px-5 py-2 font-semibold transition hover:bg-gray-50"
                        >
                          View listing
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </section>

    </main>
  );
}