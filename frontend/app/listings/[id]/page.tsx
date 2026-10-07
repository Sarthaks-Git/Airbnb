"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

type Image = {

  id: number;

  image_url: string;

  display_order: number;

};

type Amenity = {

  id: number;

  name: string;

};

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

type ListingResponse = {

  listing: Listing;

  images: Image[];

  amenities: Amenity[];

};

type Review = {

  id: number;

  listing_id: number;

  user_id: number;

  rating: number;

  comment: string;

};

const USER_ID = 3;

export default function ListingPage() {

  const params = useParams();

  const router = useRouter();

  const id = params.id;

  const [data, setData] = useState<ListingResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState<Review[]>([]);

  const [reviewRating, setReviewRating] = useState(5);

  const [reviewComment, setReviewComment] = useState("");

  const [reviewMessage, setReviewMessage] = useState("");

  const [reviewLoading, setReviewLoading] = useState(false);

  const [checkIn, setCheckIn] = useState("");

  const [checkOut, setCheckOut] = useState("");

  const [guests, setGuests] = useState(1);

  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookingMessage, setBookingMessage] = useState("");

  const [showComingSoon, setShowComingSoon] = useState(false);

  const [saved, setSaved] = useState(false);

  const [toast, setToast] = useState("");

  const [showAllPhotos, setShowAllPhotos] = useState(false);

  function getToday() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

  }

  const today = getToday();

  async function fetchReviews() {

    try {

      const response = await fetch(

        `http://127.0.0.1:8000/reviews/${id}`

      );

      if (!response.ok) {

        return;

      }

      const result = await response.json();

      setReviews(result || []);

    } catch (error) {

      console.error("Failed to fetch reviews:", error);

    }

  }

  async function toggleSave() {

    if (!data?.listing) return;

    try {

      const response = await fetch(

        `http://127.0.0.1:8000/favorites/${data.listing.id}?user_id=${USER_ID}`,

        { method: saved ? "DELETE" : "POST" }

      );

      if (!response.ok) {

        throw new Error("Favorite request failed");

      }

      setSaved((current) => !current);

      setToast(saved ? "Removed from wishlist" : "Saved to wishlist");

    } catch (error) {

      console.error("Favorite request failed:", error);

      setToast("Unable to update wishlist");

    }

  }

  async function handleShare() {

    try {

      if (navigator.share) {

        await navigator.share({

          title: data?.listing.title || "Airbnb stay",

          text: data?.listing.title || "Check out this stay",

          url: window.location.href,

        });

      } else {

        await navigator.clipboard.writeText(window.location.href);

        setToast("Link copied to clipboard");

      }

    } catch (error) {

      if ((error as DOMException).name !== "AbortError") {

        setToast("Unable to share this listing");

      }

    }

  }

  useEffect(() => {

    fetch(

      `http://127.0.0.1:8000/listings/${id}?\_=${Date.now()}`,

      {

        cache: "no-store",

      }

    )

      .then((response) => response.json())

      .then((result) => {

        setData(result);

        setLoading(false);

      })

      .catch((error) => {

        console.error("Failed to fetch listing:", error);

        setLoading(false);

      });

    fetchReviews();

  }, [id]);

  function handleCheckInChange(value: string) {

    setCheckIn(value);

    if (checkOut && value >= checkOut) {

      setCheckOut("");

    }

    setBookingMessage("");

  }

  function handleCheckOutChange(value: string) {

    setCheckOut(value);

    setBookingMessage("");

  }

  function updateGuests(amount: number) {

    setGuests((current) =>

      Math.min(

        listing.max_guests,

        Math.max(1, current + amount)

      )

    );

    setBookingMessage("");

  }

  async function handleReserve() {

    setBookingMessage("");

    if (!checkIn || !checkOut) {

      setBookingMessage(

        "Please select check-in and check-out dates."

      );

      return;

    }

    if (checkOut <= checkIn) {

      setBookingMessage(

        "Check-out must be after check-in."

      );

      return;

    }

    if (guests < 1 || guests > listing.max_guests) {

      setBookingMessage(

        `This listing allows up to ${listing.max_guests} guests.`

      );

      return;

    }

    setBookingLoading(true);

    try {

      const availabilityUrl =

        `http://127.0.0.1:8000/bookings/availability` +

        `?listing_id=${listing.id}` +

        `&check_in=${checkIn}` +

        `&check_out=${checkOut}`;

      const availabilityResponse =

        await fetch(availabilityUrl);

      const availabilityData =

        await availabilityResponse.json();

      if (!availabilityResponse.ok) {

        setBookingMessage(

          "Unable to check availability. Please try again."

        );

        setBookingLoading(false);

        return;

      }

      if (!availabilityData.available) {

        setBookingMessage(

          "Sorry, this listing is not available for those dates."

        );

        setBookingLoading(false);

        return;

      }

      /*

       * IMPORTANT:

       * We DO NOT create the booking here.

       *

       * We only verify availability and move the user

       * to the mock checkout page.

       */

      router.push(

        `/checkout?listing_id=${listing.id}` +

          `&check_in=${checkIn}` +

          `&check_out=${checkOut}` +

          `&guests=${guests}`

      );

    } catch (error) {

      console.error(

        "Availability request failed:",

        error

      );

      setBookingMessage(

        "Something went wrong. Please try again."

      );

    }

    setBookingLoading(false);

  }

  async function handleSubmitReview() {

    setReviewMessage("");

    if (!reviewComment.trim()) {

      setReviewMessage("Please write a review.");

      return;

    }

    setReviewLoading(true);

    try {

      const params = new URLSearchParams({

        listing_id: String(id),

        user_id: String(USER_ID),

        rating: String(reviewRating),

        comment: reviewComment.trim(),

      });

      const response = await fetch(

        `http://127.0.0.1:8000/reviews/?${params.toString()}`,

        {

          method: "POST",

        }

      );

      const result = await response.json();

      if (!response.ok) {

        setReviewMessage(

          result.detail || "Unable to submit review."

        );

        setReviewLoading(false);

        return;

      }

      setReviewComment("");

      setReviewRating(5);

      setReviewMessage(

        "Review submitted successfully!"

      );

      await fetchReviews();

    } catch (error) {

      console.error(

        "Review submission failed:",

        error

      );

      setReviewMessage(

        "Something went wrong. Please try again."

      );

    }

    setReviewLoading(false);

  }

  useEffect(() => {

    if (!toast) return;

    const timer = setTimeout(() => setToast(""), 2500);

    return () => clearTimeout(timer);

  }, [toast]);

  if (loading) {

    return (

      <p className="p-8">

        Loading...

      </p>

    );

  }

  if (!data || !data.listing) {

    return (

      <p className="p-8">

        Listing not found.

      </p>

    );

  }

  const { listing, images, amenities } = data;

  function calculateNights() {

    if (!checkIn || !checkOut || checkOut <= checkIn) {

      return 0;

    }

    const start = new Date(`${checkIn}T00:00:00`);

    const end = new Date(`${checkOut}T00:00:00`);

    const difference =

      end.getTime() - start.getTime();

    return Math.ceil(

      difference / (1000 * 60 * 60 * 24)

    );

  }

  const nights = calculateNights();

  const nightlyTotal =

    nights > 0

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

  const averageRating =

    reviews.length > 0

      ? reviews.reduce(

          (sum, review) => sum + review.rating,

          0

        ) / reviews.length

      : 0;

  return (

    <main className="min-h-screen bg-white text-gray-900">

      {/***** Navbar *****/}

      <nav className="flex items-center justify-between border-b px-8 py-5">

        <button

          onClick={() => router.push("/")}

          className="cursor-pointer text-2xl font-bold text-red-500 transition hover:opacity-80"

        >

          airbnb

        </button>

        <div className="flex items-center gap-6 text-sm">

          <button

            onClick={() => router.push("/")}

            className="cursor-pointer font-medium"

          >

            Explore

          </button>

          <button

            onClick={() => router.push("/trips")}

            className="cursor-pointer font-medium"

          >

            Trips

          </button>

          <button

            onClick={() => router.push("/host")}

            className="cursor-pointer"

          >

            Airbnb your home

          </button>

          <button

            onClick={() => setShowComingSoon(true)}

            className="cursor-pointer"

            aria-label="Language"

          >

            🌐

          </button>

          <button

            onClick={() => setShowComingSoon(true)}

            className="cursor-pointer"

            aria-label="Menu"

          >

            ☰

          </button>

        </div>

      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/***** Back *****/}

        <button

          onClick={() => router.push("/")}

          className="mb-6 cursor-pointer text-sm font-semibold"

        >

          ← Back to stays

        </button>

        {/***** Listing title + actions *****/}

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

          <div>

            <h1 className="text-3xl font-semibold">

              {listing.title}

            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-600">

              <span>📍 {listing.location}</span>

              <span>·</span>

              <span>

                ★ {reviews.length > 0 ? averageRating.toFixed(1) : "New"}

              </span>

              {reviews.length > 0 && (

                <>

                  <span>·</span>

                  <span>

                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}

                  </span>

                </>

              )}

            </div>

          </div>

          <div className="flex items-center gap-2">

            <button

              onClick={handleShare}

              className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-100"

            >

              ↗ Share

            </button>

            <button

              onClick={toggleSave}

              className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-100"

            >

              {saved ? "♥ Saved" : "♡ Save"}

            </button>

          </div>

        </div>

        {/***** Airbnb-style photo gallery *****/}

        <div className="relative mt-6 overflow-hidden rounded-2xl">

          {images.length > 0 ? (

            <div className="grid h-[420px] grid-cols-1 gap-2 md:grid-cols-2">

              <img

                src={images[0].image_url}

                alt={listing.title}

                loading="eager"

                decoding="async"

                className="h-full w-full object-cover md:rounded-l-2xl"

              />

              <div className="hidden grid-cols-2 grid-rows-2 gap-2 md:grid">

                {images.slice(1, 5).map((image, index) => (

                  <img

                    key={image.id}

                    src={image.image_url}

                    alt={`${listing.title} photo ${index + 2}`}

                    loading="lazy"

                    decoding="async"

                    className={`h-full w-full object-cover ${

                      index === 1 ? "rounded-tr-2xl" : ""

                    } ${index === 3 ? "rounded-br-2xl" : ""}`}

                  />

                ))}

              </div>

            </div>

          ) : (

            <div className="flex h-[420px] items-center justify-center bg-gray-100 text-gray-500">

              No photos available

            </div>

          )}

          <button

            onClick={() => setShowAllPhotos(true)}

            className="absolute bottom-4 right-4 cursor-pointer rounded-lg border bg-white px-4 py-2 text-sm font-semibold shadow-md transition hover:bg-gray-50"

          >

            ▣ Show all photos

          </button>

        </div>

        {/***** Main content *****/}

        <div className="mt-8 grid gap-10 md:grid-cols-3">

          {/***** Listing information *****/}

          <section className="md:col-span-2">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {listing.property_type} hosted by an Airbnb Host
                </h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Superhost</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="text-green-600 font-bold">✓</span>
                    Identity verified
                  </span>
                </div>
              </div>
              <div className="h-14 w-14 overflow-hidden rounded-full bg-gray-200">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" alt="Host avatar" className="h-full w-full object-cover" />
              </div>
            </div>

            <p className="mt-2 text-gray-600">

              {listing.max_guests} guests ·{" "}

              {listing.bedrooms} bedrooms ·{" "}

              {listing.beds} beds ·{" "}

              {listing.bathrooms} bathrooms

            </p>

            <hr className="my-6" />

            <h2 className="text-xl font-semibold">

              About this place

            </h2>

            <p className="mt-3 leading-7 text-gray-600">

              {listing.description}

            </p>

            <hr className="my-6" />

            <h2 className="text-xl font-semibold">

              What this place offers

            </h2>

            <div className="mt-4 grid grid-cols-2 gap-4">

              {amenities.map((amenity) => (

                <div

                  key={amenity.id}

                  className="rounded-lg border p-3"

                >

                  {amenity.name}

                </div>

              ))}

            </div>

            <hr className="my-8" />
            <h2 className="text-xl font-semibold mb-4">Where you'll be</h2>
            <div className="h-[400px] w-full rounded-2xl bg-gray-100 overflow-hidden relative shadow-inner border">
              <div className="absolute inset-0 z-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=India&zoom=11&size=800x400&scale=2&maptype=roadmap&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:administrative|element:geometry.stroke|color:0xcbd1d1&style=feature:landscape|element:geometry|color:0xf5f5f5&style=feature:water|element:geometry|color:0xc9c9c9')] bg-cover bg-center opacity-80 mix-blend-multiply"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="h-16 w-16 rounded-full bg-[#ff385c]/20 flex items-center justify-center animate-pulse absolute -inset-2"></div>
                <div className="relative bg-[#ff385c] text-white px-4 py-2 rounded-2xl shadow-lg font-bold flex flex-col items-center">
                  <span>🏠</span>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#ff385c] rotate-45"></div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">{listing.location}</p>
            <p className="mt-1 text-gray-500 text-sm">Exact location provided after booking.</p>

            {/***** Reviews *****/}

            <hr className="my-8" />

            <div>

              <h2 className="text-xl font-semibold">

                ⭐{" "}

                {reviews.length > 0

                  ? averageRating.toFixed(1)

                  : "New"}{" "}

                · {reviews.length}{" "}

                {reviews.length === 1

                  ? "review"

                  : "reviews"}

              </h2>

              {reviews.length === 0 ? (

                <p className="mt-4 text-gray-500">

                  No reviews yet. Be the first guest to

                  leave a review.

                </p>

              ) : (

                <div className="mt-5 space-y-5">

                  {reviews.map((review) => (

                    <div

                      key={review.id}

                      className="rounded-xl border p-4"

                    >

                      <div className="flex items-center justify-between">

                        <span className="font-semibold">

                          Guest

                        </span>

                        <span>

                          {"★".repeat(review.rating)}

                          {"☆".repeat(5 - review.rating)}

                        </span>

                      </div>

                      <p className="mt-2 text-gray-600">

                        {review.comment}

                      </p>

                    </div>

                  ))}

                </div>

              )}

              {/***** Review form *****/}

              <div className="mt-8 rounded-xl border p-5">

                <h3 className="font-semibold">

                  Leave a review

                </h3>

                <p className="mt-1 text-sm text-gray-500">

                  You must have a confirmed booking for

                  this listing.

                </p>

                <div className="mt-4">

                  <label className="text-sm font-medium">

                    Rating

                  </label>

                  <select

                    value={reviewRating}

                    onChange={(event) =>

                      setReviewRating(

                        Number(event.target.value)

                      )

                    }

                    className="mt-2 w-full cursor-pointer rounded-lg border bg-white p-2 outline-none"

                  >

                    <option value={5}>

                      5 - Excellent

                    </option>

                    <option value={4}>

                      4 - Great

                    </option>

                    <option value={3}>

                      3 - Good

                    </option>

                    <option value={2}>

                      2 - Okay

                    </option>

                    <option value={1}>

                      1 - Poor

                    </option>

                  </select>

                </div>

                <textarea

                  value={reviewComment}

                  onChange={(event) =>

                    setReviewComment(event.target.value)

                  }

                  placeholder="Share your experience..."

                  rows={4}

                  className="mt-4 w-full rounded-lg border p-3 outline-none"

                />

                <button

                  onClick={handleSubmitReview}

                  disabled={reviewLoading}

                  className="mt-3 cursor-pointer rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"

                >

                  {reviewLoading

                    ? "Submitting..."

                    : "Submit review"}

                </button>

                {reviewMessage && (

                  <p className="mt-3 text-sm font-medium">

                    {reviewMessage}

                  </p>

                )}

              </div>

            </div>

          </section>

          {/***** Booking card *****/}

          <aside className="h-fit rounded-xl border p-6 shadow-lg md:sticky md:top-24">

            <p className="text-xl font-semibold">

              ₹{listing.price_per_night.toLocaleString()}

              <span className="text-sm font-normal">

                {" "}night

              </span>

            </p>

            <div className="mt-5 rounded-lg border">

              {/***** Dates *****/}

              <div className="grid grid-cols-2">

                <div className="border-r p-3">

                  <label className="text-xs font-semibold">

                    CHECK-IN

                  </label>

                  <input

                    type="date"

                    min={today}

                    value={checkIn}

                    onChange={(event) =>

                      handleCheckInChange(

                        event.target.value

                      )

                    }

                    className="mt-1 w-full cursor-pointer bg-transparent text-sm outline-none"

                  />

                </div>

                <div className="p-3">

                  <label className="text-xs font-semibold">

                    CHECK-OUT

                  </label>

                  <input

                    type="date"

                    min={checkIn || today}

                    value={checkOut}

                    disabled={!checkIn}

                    onChange={(event) =>

                      handleCheckOutChange(

                        event.target.value

                      )

                    }

                    className="mt-1 w-full cursor-pointer bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:text-gray-400"

                  />

                </div>

              </div>

              {/***** Guests *****/}

              <div className="border-t p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <label className="text-xs font-semibold">

                      GUESTS

                    </label>

                    <p className="mt-1 text-sm text-gray-500">

                      {guests} {guests === 1 ? "guest" : "guests"}

                    </p>

                  </div>

                  <div className="flex items-center gap-3">

                    <button

                      type="button"

                      onClick={() => updateGuests(-1)}

                      disabled={guests <= 1}

                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-lg text-gray-600 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-40"

                      aria-label="Decrease guests"

                    >

                      −

                    </button>

                    <span className="w-5 text-center text-sm font-semibold">

                      {guests}

                    </span>

                    <button

                      type="button"

                      onClick={() => updateGuests(1)}

                      disabled={guests >= listing.max_guests}

                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-lg text-gray-600 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-40"

                      aria-label="Increase guests"

                    >

                      +

                    </button>

                  </div>

                </div>

              </div>

            </div>

            {/***** Price breakdown *****/}

            {nights > 0 && (

              <div className="mt-5 space-y-3 text-sm">

                <div className="flex justify-between">

                  <span>

                    ₹{listing.price_per_night.toLocaleString()} ×{" "}

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

                    ₹{Math.round(

                      serviceFee

                    ).toLocaleString()}

                  </span>

                </div>

                <hr />

                <div className="flex justify-between text-base font-semibold">

                  <span>

                    Total

                  </span>

                  <span>

                    ₹{Math.round(

                      totalPrice

                    ).toLocaleString()}

                  </span>

                </div>

              </div>

            )}

            {/***** Reserve *****/}

            <button

              onClick={handleReserve}

              disabled={

                bookingLoading ||

                !checkIn ||

                !checkOut ||

                checkOut <= checkIn

              }

              className="mt-5 w-full cursor-pointer rounded-lg bg-red-500 py-3 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"

            >

              {bookingLoading

                ? "Checking availability..."

                : "Reserve"}

            </button>

            <p className="mt-3 text-center text-xs text-gray-500">

              You won't be charged yet

            </p>

            {/***** Booking result *****/}

            {bookingMessage && (

              <div

                className={`mt-4 rounded-lg p-3 text-center text-sm font-medium ${

                  bookingMessage.startsWith(

                    "Booking confirmed"

                  )

                    ? "bg-green-50 text-green-700"

                    : "bg-red-50 text-red-600"

                }`}

              >

                {bookingMessage}

              </div>

            )}

          </aside>

        </div>

      </div>

      {toast && (

        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">

          {toast}

        </div>

      )}

      {/***** Photo gallery modal *****/}

      {showAllPhotos && (

        <div

          className="fixed inset-0 z-[80] overflow-y-auto bg-black/90 p-4 md:p-8"

          onClick={() => setShowAllPhotos(false)}

        >

          <div className="mx-auto max-w-5xl" onClick={(event) => event.stopPropagation()}>

            <div className="mb-5 flex items-center justify-between text-white">

              <h2 className="text-lg font-semibold">

                {images.length} photos

              </h2>

              <button

                onClick={() => setShowAllPhotos(false)}

                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-2xl transition hover:bg-white/20"

                aria-label="Close photo gallery"

              >

                ×

              </button>

            </div>

            <div className="grid gap-3 sm:grid-cols-2">

              {images.map((image, index) => (

                <img

                  key={image.id}

                  src={image.image_url}

                  alt={`${listing.title} photo ${index + 1}`}

                  loading={index === 0 ? "eager" : "lazy"}

                  decoding="async"

                  className="max-h-[70vh] w-full rounded-xl object-cover"

                />

              ))}

            </div>

          </div>

        </div>

      )}

      {/***** Coming Soon Modal *****/}

      {showComingSoon && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"

          onClick={() => setShowComingSoon(false)}

        >

          <div

            className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="text-5xl">

              🚧

            </div>

            <h2 className="mt-4 text-2xl font-semibold">

              Coming Soon

            </h2>

            <p className="mt-3 text-gray-500">

              This feature is currently under development

              and will be available soon.

            </p>

            <button

              onClick={() => setShowComingSoon(false)}

              className="mt-6 cursor-pointer rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"

            >

              Got it

            </button>

          </div>

        </div>

      )}

    </main>

  );

}
