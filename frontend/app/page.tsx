"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Listing = {
  id: number;
  title: string;
  location: string;
  price_per_night: number;
  property_type: string;
  max_guests: number;
  image_url: string | null;
};

const USER_ID = 3;

export default function Home() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyType, setPropertyType] = useState("");

  function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const today = getToday();

  async function fetchListings() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (location.trim()) {
        params.append("location", location.trim());
      }

      if (guests) {
        params.append("guests", guests);
      }

      if (checkIn) {
        params.append("check_in", checkIn);
      }

      if (checkOut) {
        params.append("check_out", checkOut);
      }

      if (minPrice) {
        params.append("min_price", minPrice);
      }

      if (maxPrice) {
        params.append("max_price", maxPrice);
      }

      if (propertyType) {
        params.append("property_type", propertyType);
      }

      const response = await fetch(
        `http://127.0.0.1:8000/listings/?${params.toString()}`
      );

      const data = await response.json();

      setListings(data.items || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFavorites() {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/favorites/?user_id=${USER_ID}`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setFavoriteIds(
        data.map((listing: Listing) => listing.id)
      );
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    }
  }

  useEffect(() => {
    fetchListings();
    fetchFavorites();
  }, []);

  function handleCheckInChange(value: string) {
    setCheckIn(value);

    if (checkOut && value > checkOut) {
      setCheckOut("");
    }
  }

  function handleSearch() {
    if (checkIn && checkOut && checkOut <= checkIn) {
      alert("Check-out must be after check-in.");
      return;
    }

    if (
      minPrice &&
      maxPrice &&
      Number(minPrice) > Number(maxPrice)
    ) {
      alert("Maximum price must be greater than minimum price.");
      return;
    }

    fetchListings();
  }

  function clearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setPropertyType("");
  }

  async function toggleFavorite(
    event: React.MouseEvent<HTMLButtonElement>,
    listingId: number
  ) {
    event.stopPropagation();

    const isFavorite = favoriteIds.includes(listingId);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/favorites/${listingId}?user_id=${USER_ID}`,
        {
          method: isFavorite ? "DELETE" : "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update favorite");
      }

      if (isFavorite) {
        setFavoriteIds((current) =>
          current.filter((id) => id !== listingId)
        );
      } else {
        setFavoriteIds((current) => [
          ...current,
          listingId,
        ]);
      }
    } catch (error) {
      console.error("Failed to update favorite:", error);
      alert("Could not update wishlist. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <nav className="flex items-center justify-between border-b px-8 py-5">

        {/* Airbnb Logo */}
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer text-2xl font-bold text-red-500 transition hover:opacity-80"
        >
          airbnb
        </button>

        <div className="flex items-center gap-6 text-sm">

          <button
            onClick={() => router.push("/trips")}
            className="cursor-pointer font-medium hover:underline"
          >
            Trips
          </button>

          <button
            onClick={() => router.push("/host")}
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

      {/* Search */}
      <section className="border-b px-8 py-6">

        <div className="mx-auto flex max-w-4xl items-center rounded-full border bg-white px-6 py-3 shadow-md">

          {/* Location */}
          <div className="flex-1 border-r px-4">

            <label className="text-xs font-semibold">
              Where
            </label>

            <input
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="Search destinations"
              className="mt-1 w-full bg-transparent text-sm outline-none"
            />

          </div>

          {/* Check-in */}
          <div className="flex-1 border-r px-4">

            <label className="text-xs font-semibold">
              Check in
            </label>

            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(event) =>
                handleCheckInChange(event.target.value)
              }
              className="mt-1 w-full cursor-pointer bg-transparent text-sm outline-none"
            />

          </div>

          {/* Check-out */}
          <div className="flex-1 border-r px-4">

            <label className="text-xs font-semibold">
              Check out
            </label>

            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              disabled={!checkIn}
              onChange={(event) =>
                setCheckOut(event.target.value)
              }
              className="mt-1 w-full cursor-pointer bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:text-gray-400"
            />

          </div>

          {/* Guests */}
          <div className="flex-1 px-4">

            <label className="text-xs font-semibold">
              Who
            </label>

            <select
              value={guests}
              onChange={(event) =>
                setGuests(event.target.value)
              }
              className="mt-1 w-full cursor-pointer bg-transparent text-sm outline-none"
            >
              <option value="">
                Add guests
              </option>

              {[1, 2, 3, 4, 5, 6].map((number) => (
                <option
                  key={number}
                  value={number}
                >
                  {number}{" "}
                  {number === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>

          </div>

          {/* Search */}
          <button
            onClick={handleSearch}
            className="cursor-pointer rounded-full bg-red-500 px-5 py-3 text-white transition hover:bg-red-600"
          >
            🔍
          </button>

        </div>

        {/* Filter button */}
        <div className="mx-auto mt-4 flex max-w-6xl justify-end">

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="cursor-pointer rounded-full border px-5 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            ⚙ Filters
          </button>

        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mx-auto mt-4 max-w-6xl rounded-2xl border bg-white p-6 shadow-md">

            <div className="grid gap-6 md:grid-cols-3">

              {/* Minimum price */}
              <div>

                <label className="text-sm font-semibold">
                  Minimum price
                </label>

                <div className="mt-2 flex items-center rounded-lg border px-3">

                  <span className="text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) =>
                      setMinPrice(event.target.value)
                    }
                    placeholder="Any"
                    className="w-full p-2 outline-none"
                  />

                </div>

              </div>

              {/* Maximum price */}
              <div>

                <label className="text-sm font-semibold">
                  Maximum price
                </label>

                <div className="mt-2 flex items-center rounded-lg border px-3">

                  <span className="text-gray-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) =>
                      setMaxPrice(event.target.value)
                    }
                    placeholder="Any"
                    className="w-full p-2 outline-none"
                  />

                </div>

              </div>

              {/* Property type */}
              <div>

                <label className="text-sm font-semibold">
                  Property type
                </label>

                <select
                  value={propertyType}
                  onChange={(event) =>
                    setPropertyType(event.target.value)
                  }
                  className="mt-2 w-full cursor-pointer rounded-lg border bg-white p-2 outline-none"
                >
                  <option value="">
                    Any type
                  </option>

                  <option value="Apartment">
                    Apartment
                  </option>

                  <option value="Villa">
                    Villa
                  </option>

                  <option value="House">
                    House
                  </option>
                </select>

              </div>

            </div>

            {/* Filter actions */}
            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={clearFilters}
                className="cursor-pointer rounded-lg border px-5 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Clear
              </button>

              <button
                onClick={() => {
                  handleSearch();
                  setShowFilters(false);
                }}
                className="cursor-pointer rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                Apply filters
              </button>

            </div>

          </div>
        )}

      </section>

      {/* Categories */}
      <section className="border-b px-8 py-5">

        <div className="mx-auto flex max-w-6xl gap-8 overflow-x-auto text-sm">

          <div className="cursor-pointer whitespace-nowrap">
            🏠 <span className="ml-2">Homes</span>
          </div>

          <div className="cursor-pointer whitespace-nowrap">
            🏖️ <span className="ml-2">Beach</span>
          </div>

          <div className="cursor-pointer whitespace-nowrap">
            🏊 <span className="ml-2">Amazing pools</span>
          </div>

          <div className="cursor-pointer whitespace-nowrap">
            🌆 <span className="ml-2">Amazing views</span>
          </div>

          <div className="cursor-pointer whitespace-nowrap">
            🏡 <span className="ml-2">Countryside</span>
          </div>

        </div>

      </section>

      {/* Listings */}
      <section className="mx-auto max-w-6xl px-8 py-8">

        <h2 className="mb-6 text-2xl font-semibold">
          Explore stays
        </h2>

        {loading ? (

          <p className="text-gray-500">
            Loading listings...
          </p>

        ) : listings.length === 0 ? (

          <div className="rounded-xl border p-10 text-center">

            <h3 className="text-lg font-semibold">
              No stays found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try different search or filter options.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">

            {listings.map((listing) => {

              const isFavorite =
                favoriteIds.includes(listing.id);

              return (
                <div
                  key={listing.id}
                  onClick={() =>
                    window.open(
                      `/listings/${listing.id}`,
                      "_blank"
                    )
                  }
                  className="cursor-pointer"
                >

                  <div className="relative overflow-hidden rounded-xl">

                    <img
                      src={
                        listing.image_url ||
                        "/placeholder.jpg"
                      }
                      alt={listing.title}
                      className="h-64 w-full object-cover transition duration-300 hover:scale-105"
                    />

                    <button
                      onClick={(event) =>
                        toggleFavorite(event, listing.id)
                      }
                      className="absolute right-3 top-3 cursor-pointer text-3xl text-white drop-shadow transition hover:scale-110"
                      aria-label={
                        isFavorite
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                    >
                      {isFavorite ? "♥" : "♡"}
                    </button>

                  </div>

                  <div className="mt-3">

                    <div className="flex items-start justify-between gap-2">

                      <h3 className="font-semibold">
                        {listing.title}
                      </h3>

                      <span className="text-sm">
                        ★ 4.8
                      </span>

                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {listing.location}
                    </p>

                    <p className="mt-2">

                      <span className="font-semibold">
                        ₹
                        {listing.price_per_night.toLocaleString()}
                      </span>{" "}
                      night

                    </p>

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