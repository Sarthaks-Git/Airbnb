 "use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";
const HOST_ID = 1;

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

type FormState = {
  title: string;
  description: string;
  location: string;
  property_type: string;
  price_per_night: string;
  max_guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  image_url: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  location: "",
  property_type: "Apartment",
  price_per_night: "",
  max_guests: "2",
  bedrooms: "1",
  beds: "1",
  bathrooms: "1",
  image_url: "",
};

export default function HostPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [listingImages, setListingImages] = useState<Record<number, string>>(
    {}
  );

  async function loadDashboard() {
    setLoading(true);

    try {
      const [listingResponse, bookingResponse] = await Promise.all([
        fetch(`${API_URL}/host/listings?host_id=${HOST_ID}`),
        fetch(`${API_URL}/host/bookings?host_id=${HOST_ID}`),
      ]);

      if (!listingResponse.ok || !bookingResponse.ok) {
        throw new Error("Unable to load host dashboard");
      }

      const listingData = await listingResponse.json();
      const bookingData = await bookingResponse.json();

      setListings(listingData || []);
      setBookings(bookingData || []);

      const imageEntries = await Promise.all(
        (listingData || []).map(async (listing: Listing) => {
          try {
            const response = await fetch(
              `${API_URL}/listings/${listing.id}`
            );

            if (!response.ok) return [listing.id, ""] as const;

            const data = await response.json();
            return [
              listing.id,
              data.images?.[0]?.image_url || "",
            ] as const;
          } catch {
            return [listing.id, ""] as const;
          }
        })
      );

      setListingImages(Object.fromEntries(imageEntries));
    } catch (error) {
      console.error(error);
      showMessage("Unable to load the host dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function showMessage(
    text: string,
    type: "success" | "error" = "success"
  ) {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(listing: Listing) {
    setEditingId(listing.id);

    setForm({
      title: listing.title,
      description: listing.description,
      location: listing.location,
      property_type: listing.property_type,
      price_per_night: String(listing.price_per_night),
      max_guests: String(listing.max_guests),
      bedrooms: String(listing.bedrooms),
      beds: String(listing.beds),
      bathrooms: String(listing.bathrooms),
      image_url: listingImages[listing.id] || "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.price_per_night
    ) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    setSaving(true);

    try {
      const params = new URLSearchParams({
        ...(editingId
          ? {}
          : {
              host_id: String(HOST_ID),
            }),
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        property_type: form.property_type,
        price_per_night: form.price_per_night,
        max_guests: form.max_guests,
        bedrooms: form.bedrooms,
        beds: form.beds,
        bathrooms: form.bathrooms,
      });

      let response: Response;

      if (editingId) {
        response = await fetch(
          `${API_URL}/host/listings/${editingId}?host_id=${HOST_ID}&${params.toString()}`,
          {
            method: "PUT",
          }
        );
      } else {
        const createParams = new URLSearchParams({
          host_id: String(HOST_ID),
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          property_type: form.property_type,
          price_per_night: form.price_per_night,
          max_guests: form.max_guests,
          bedrooms: form.bedrooms,
          beds: form.beds,
          bathrooms: form.bathrooms,
        });

        if (form.image_url.trim()) {
          createParams.set("image_urls", form.image_url.trim());
        }

        response = await fetch(
          `${API_URL}/host/listings?${createParams.toString()}`,
          {
            method: "POST",
          }
        );
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.detail || "Unable to save listing."
        );
      }

      closeForm();

      showMessage(
        editingId
          ? "Listing updated successfully."
          : "Listing created successfully."
      );

      await loadDashboard();
    } catch (error) {
      console.error(error);
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to save listing.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(listingId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/host/listings/${listingId}?host_id=${HOST_ID}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.detail || "Unable to delete listing."
        );
      }

      showMessage("Listing deleted successfully.");
      await loadDashboard();
    } catch (error) {
      console.error(error);
      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete listing.",
        "error"
      );
    }
  }

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.total_price || 0),
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer text-2xl font-bold tracking-tight text-[#ff385c]"
          >
            airbnb
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              Explore
            </button>

            <button
              onClick={() => router.push("/trips")}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
            >
              Trips
            </button>

            <button
              onClick={openCreate}
              className="hidden cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition hover:bg-gray-100 sm:block"
            >
              Airbnb your home
            </button>

            <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border bg-green-100 text-sm font-semibold text-green-700">
              S
            </div>
          </div>
        </div>
      </header>

      {message && (
        <div
          className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-xl ${
            messageType === "error"
              ? "bg-red-600"
              : "bg-gray-900"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mx-auto max-w-[1440px] px-6 py-10">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Host dashboard
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Welcome back, Sarthak
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your homes and keep track of your reservations.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="cursor-pointer rounded-full bg-[#ff385c] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e31c5f]"
          >
            + Create a listing
          </button>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Listings", listings.length, "Homes you host"],
            ["Bookings", bookings.length, "Reservations received"],
            [
              "Revenue",
              `₹${Math.round(totalRevenue).toLocaleString("en-IN")}`,
              "Total booking value",
            ],
            [
              "Avg. price",
              listings.length
                ? `₹${Math.round(
                    listings.reduce(
                      (sum, item) =>
                        sum + item.price_per_night,
                      0
                    ) / listings.length
                  ).toLocaleString("en-IN")}`
                : "₹0",
              "Per night",
            ],
          ].map(([label, value, subtitle]) => (
            <div
              key={label}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">
                {value}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {subtitle}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Your listings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Create, edit, or manage your properties.
              </p>
            </div>

            <span className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-gray-200">
              {listings.length}{" "}
              {listings.length === 1 ? "listing" : "listings"}
            </span>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border bg-white p-4">
                  <div className="h-52 animate-pulse rounded-xl bg-gray-200" />
                  <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-white px-6 py-20 text-center">
              <div className="text-5xl">🏡</div>
              <h3 className="mt-5 text-xl font-semibold">
                You have no listings yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Create your first property and start hosting
                guests.
              </p>
              <button
                onClick={openCreate}
                className="mt-6 cursor-pointer rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
              >
                Create your first listing
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    {listingImages[listing.id] ? (
                      <img
                        src={listingImages[listing.id]}
                        alt={listing.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        🏡
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
                      {listing.property_type}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {listing.title}
                        </h3>
                        <p className="mt-1 truncate text-sm text-gray-500">
                          {listing.location}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm">
                        <span className="font-semibold">
                          ₹
                          {listing.price_per_night.toLocaleString(
                            "en-IN"
                          )}
                        </span>{" "}
                        / night
                      </p>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                      {listing.max_guests} guests ·{" "}
                      {listing.bedrooms} bedrooms ·{" "}
                      {listing.beds} beds ·{" "}
                      {listing.bathrooms} bathrooms
                    </p>

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() =>
                          window.open(
                            `/listings/${listing.id}`,
                            "_blank"
                          )
                        }
                        className="flex-1 cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
                      >
                        View
                      </button>

                      <button
                        onClick={() => openEdit(listing)}
                        className="flex-1 cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="cursor-pointer rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Recent bookings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Reservations made for your properties.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">
              No bookings yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Listing
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Dates
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Guests
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Nights
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Total
                      </th>
                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.map((booking) => {
                      const listing = listings.find(
                        (item) => item.id === booking.listing_id
                      );

                      return (
                        <tr
                          key={booking.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-5 py-4 font-medium">
                            {listing?.title ||
                              `Listing #${booking.listing_id}`}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {booking.check_in} →{" "}
                            {booking.check_out}
                          </td>

                          <td className="px-5 py-4">
                            {booking.guests}
                          </td>

                          <td className="px-5 py-4">
                            {booking.nights}
                          </td>

                          <td className="px-5 py-4 font-semibold">
                            ₹
                            {Math.round(
                              booking.total_price
                            ).toLocaleString("en-IN")}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Host tools
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {editingId
                    ? "Edit your listing"
                    : "Create a new listing"}
                </h2>
              </div>

              <button
                onClick={closeForm}
                className="cursor-pointer rounded-full px-3 py-2 text-xl transition hover:bg-gray-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="text-sm font-semibold">
                    Title
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="Beautiful lake house"
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="text-sm font-semibold">
                    Description
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Describe your place..."
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Location
                  </span>
                  <input
                    value={form.location}
                    onChange={(event) =>
                      updateField(
                        "location",
                        event.target.value
                      )
                    }
                    placeholder="Goa"
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Property type
                  </span>
                  <select
                    value={form.property_type}
                    onChange={(event) =>
                      updateField(
                        "property_type",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full cursor-pointer rounded-xl border bg-white px-4 py-3 outline-none"
                  >
                    <option value="Apartment">
                      Apartment
                    </option>
                    <option value="Villa">Villa</option>
                    <option value="House">House</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Price per night
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={form.price_per_night}
                    onChange={(event) =>
                      updateField(
                        "price_per_night",
                        event.target.value
                      )
                    }
                    placeholder="4500"
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Maximum guests
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.max_guests}
                    onChange={(event) =>
                      updateField(
                        "max_guests",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Bedrooms
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.bedrooms}
                    onChange={(event) =>
                      updateField(
                        "bedrooms",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Beds
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.beds}
                    onChange={(event) =>
                      updateField(
                        "beds",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Bathrooms
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={form.bathrooms}
                    onChange={(event) =>
                      updateField(
                        "bathrooms",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                  />
                </label>

                {!editingId && (
                  <label className="md:col-span-2">
                    <span className="text-sm font-semibold">
                      Cover image URL
                    </span>
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(event) =>
                        updateField(
                          "image_url",
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      className="mt-2 w-full rounded-xl border px-4 py-3 outline-none transition focus:border-gray-900"
                    />
                    <span className="mt-1 block text-xs text-gray-500">
                      Paste a public image URL. Multiple images
                      can be added later from the backend.
                    </span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="cursor-pointer rounded-full border px-6 py-3 text-sm font-semibold transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer rounded-full bg-[#ff385c] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#e31c5f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save changes"
                    : "Create listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
