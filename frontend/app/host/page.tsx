"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Listing = {
  id: number;
  host_id: number;
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

type Booking = {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  total_price: number;
  status: string;
};

const HOST_ID = 1;

export default function HostPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [price, setPrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [beds, setBeds] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function loadDashboard() {
    setLoading(true);

    try {
      const [listingResponse, bookingResponse] =
        await Promise.all([
          fetch(
            `http://127.0.0.1:8000/host/listings?host_id=${HOST_ID}`
          ),
          fetch(
            `http://127.0.0.1:8000/host/bookings?host_id=${HOST_ID}`
          ),
        ]);

      const listingData = await listingResponse.json();
      const bookingData = await bookingResponse.json();

      setListings(listingData);
      setBookings(bookingData);
    } catch (error) {
      console.error(
        "Failed to load host dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setLocation("");
    setPropertyType("Apartment");
    setPrice("");
    setMaxGuests("");
    setBedrooms("");
    setBeds("");
    setBathrooms("");
    setImageUrl("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEditing(listing: Listing) {
    setEditingId(listing.id);

    setTitle(listing.title);
    setDescription(listing.description);
    setLocation(listing.location);
    setPropertyType(listing.property_type);
    setPrice(String(listing.price_per_night));
    setMaxGuests(String(listing.max_guests));
    setBedrooms(String(listing.bedrooms));
    setBeds(String(listing.beds));
    setBathrooms(String(listing.bathrooms));

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !title ||
      !description ||
      !location ||
      !price ||
      !maxGuests ||
      !bedrooms ||
      !beds ||
      !bathrooms
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    try {
      const params = new URLSearchParams();

      params.append("host_id", String(HOST_ID));
      params.append("title", title);
      params.append("description", description);
      params.append("location", location);
      params.append("property_type", propertyType);
      params.append("price_per_night", price);
      params.append("max_guests", maxGuests);
      params.append("bedrooms", bedrooms);
      params.append("beds", beds);
      params.append("bathrooms", bathrooms);

      if (imageUrl.trim() && editingId === null) {
        params.append(
          "image_urls",
          imageUrl.trim()
        );
      }

      const url =
        editingId === null
          ? "http://127.0.0.1:8000/host/listings"
          : `http://127.0.0.1:8000/host/listings/${editingId}`;

      const response = await fetch(
        `${url}?${params.toString()}`,
        {
          method:
            editingId === null
              ? "POST"
              : "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Listing save failed:",
          data
        );

        alert(
          data.detail ||
            "Failed to save listing."
        );

        return;
      }

      alert(
        editingId === null
          ? "Listing created successfully!"
          : "Listing updated successfully!"
      );

      resetForm();
      await loadDashboard();
    } catch (error) {
      console.error(
        "Failed to save listing:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteListing(
    listingId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/host/listings/${listingId}?host_id=${HOST_ID}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Failed to delete listing."
        );
        return;
      }

      await loadDashboard();
    } catch (error) {
      console.error(
        "Failed to delete listing:",
        error
      );

      alert(
        "Something went wrong while deleting the listing."
      );
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getListingTitle(
    listingId: number
  ) {
    return (
      listings.find(
        (listing) => listing.id === listingId
      )?.title ||
      `Listing #${listingId}`
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-8">
        <p className="text-gray-500">
          Loading host dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Navbar */}
      <nav className="flex items-center justify-between border-b bg-white px-8 py-5">

        <Link
          href="/"
          className="cursor-pointer text-2xl font-bold text-red-500 transition hover:opacity-80"
        >
          airbnb
        </Link>

        <div className="flex items-center gap-6 text-sm">

          <Link
            href="/"
            className="cursor-pointer font-medium hover:underline"
          >
            Explore
          </Link>

          <Link
            href="/trips"
            className="cursor-pointer font-medium hover:underline"
          >
            Trips
          </Link>

          <span className="font-semibold">
            Host dashboard
          </span>

        </div>

      </nav>

      {/* Dashboard */}
      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-3xl font-semibold">
              Host dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your properties and bookings.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="cursor-pointer rounded-lg bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600"
          >
            {showForm
              ? "Cancel"
              : "+ Add listing"}
          </button>

        </div>

        {/* Create / Edit form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border bg-white p-6 shadow-sm"
          >

            <h2 className="text-xl font-semibold">
              {editingId === null
                ? "Create a new listing"
                : "Edit listing"}
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              {/* Title */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Title
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Modern apartment in Mumbai"
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Describe your property..."
                  rows={4}
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-semibold">
                  Location
                </label>

                <input
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="Mumbai, Maharashtra"
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Property type */}
              <div>
                <label className="text-sm font-semibold">
                  Property type
                </label>

                <select
                  value={propertyType}
                  onChange={(event) =>
                    setPropertyType(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full cursor-pointer rounded-lg border bg-white p-3 outline-none focus:border-red-500"
                >
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

              {/* Price */}
              <div>
                <label className="text-sm font-semibold">
                  Price per night
                </label>

                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  placeholder="4500"
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Max guests */}
              <div>
                <label className="text-sm font-semibold">
                  Maximum guests
                </label>

                <input
                  type="number"
                  min="1"
                  value={maxGuests}
                  onChange={(event) =>
                    setMaxGuests(
                      event.target.value
                    )
                  }
                  placeholder="4"
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label className="text-sm font-semibold">
                  Bedrooms
                </label>

                <input
                  type="number"
                  min="1"
                  value={bedrooms}
                  onChange={(event) =>
                    setBedrooms(
                      event.target.value
                    )
                  }
                  placeholder="2"
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Beds */}
              <div>
                <label className="text-sm font-semibold">
                  Beds
                </label>

                <input
                  type="number"
                  min="1"
                  value={beds}
                  onChange={(event) =>
                    setBeds(event.target.value)
                  }
                  placeholder="2"
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Bathrooms */}
              <div>
                <label className="text-sm font-semibold">
                  Bathrooms
                </label>

                <input
                  type="number"
                  min="1"
                  value={bathrooms}
                  onChange={(event) =>
                    setBathrooms(
                      event.target.value
                    )
                  }
                  placeholder="2"
                  className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                />
              </div>

              {/* Image */}
              {editingId === null && (
                <div>
                  <label className="text-sm font-semibold">
                    Image URL
                  </label>

                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(event) =>
                      setImageUrl(
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                    className="mt-2 w-full rounded-lg border p-3 outline-none focus:border-red-500"
                  />
                </div>
              )}

            </div>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={resetForm}
                className="cursor-pointer rounded-lg border px-5 py-3 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Create listing"
                    : "Save changes"}
              </button>

            </div>

          </form>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Your listings
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {listings.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total bookings
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {bookings.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Confirmed bookings
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {
                bookings.filter(
                  (booking) =>
                    booking.status ===
                    "confirmed"
                ).length
              }
            </p>
          </div>

        </div>

        {/* Your listings */}
        <section className="mt-10">

          <h2 className="text-2xl font-semibold">
            Your listings
          </h2>

          {listings.length === 0 ? (

            <div className="mt-5 rounded-xl border bg-white p-10 text-center">

              <h3 className="text-lg font-semibold">
                You have no listings yet
              </h3>

              <p className="mt-2 text-gray-500">
                Create your first property to start hosting.
              </p>

              <button
                onClick={() =>
                  setShowForm(true)
                }
                className="mt-5 cursor-pointer rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600"
              >
                Create listing
              </button>

            </div>

          ) : (

            <div className="mt-5 grid gap-5 md:grid-cols-2">

              {listings.map((listing) => (

                <div
                  key={listing.id}
                  className="rounded-xl border bg-white p-6 shadow-sm"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h3 className="text-xl font-semibold">
                        {listing.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {listing.location}
                      </p>

                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                      {listing.property_type}
                    </span>

                  </div>

                  <p className="mt-4 text-sm text-gray-600">
                    {listing.max_guests} guests ·{" "}
                    {listing.bedrooms} bedrooms ·{" "}
                    {listing.beds} beds ·{" "}
                    {listing.bathrooms} bathrooms
                  </p>

                  <p className="mt-4 text-lg font-semibold">
                    ₹{listing.price_per_night.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">
                      {" "}per night
                    </span>
                  </p>

                  <div className="mt-5 flex gap-3">

                    <button
                      onClick={() =>
                        startEditing(listing)
                      }
                      className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteListing(listing.id)
                      }
                      className="cursor-pointer rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `/listings/${listing.id}`,
                          "_blank"
                        )
                      }
                      className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      View
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* Bookings */}
        <section className="mt-12">

          <h2 className="text-2xl font-semibold">
            Guest bookings
          </h2>

          {bookings.length === 0 ? (

            <div className="mt-5 rounded-xl border bg-white p-8 text-center text-gray-500">
              No bookings for your properties yet.
            </div>

          ) : (

            <div className="mt-5 overflow-x-auto rounded-xl border bg-white shadow-sm">

              <table className="w-full min-w-[700px] text-left">

                <thead className="border-b bg-gray-50">

                  <tr>

                    <th className="px-5 py-4 text-sm font-semibold">
                      Listing
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold">
                      Check-in
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold">
                      Check-out
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold">
                      Guests
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold">
                      Total
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {bookings.map((booking) => (

                    <tr
                      key={booking.id}
                      className="border-b last:border-b-0"
                    >

                      <td className="px-5 py-4 font-medium">
                        {getListingTitle(
                          booking.listing_id
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {formatDate(
                          booking.check_in
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {formatDate(
                          booking.check_out
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {booking.guests}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold">
                        ₹{booking.total_price.toLocaleString()}
                      </td>

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                          {booking.status}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </section>

    </main>
  );
}