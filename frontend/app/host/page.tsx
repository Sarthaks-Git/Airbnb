"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const HOST_ID = 1;

const AMENITY_OPTIONS = [
  "WiFi",
  "Kitchen",
  "Air conditioning",
  "Heating",
  "Washer",
  "Dryer",
  "Free parking",
  "Pool",
  "Hot tub",
  "TV",
  "Workspace",
  "Hair dryer",
  "Iron",
  "Dedicated workspace",
  "Breakfast",
  "Beach access",
  "Mountain view",
  "Lake view",
  "Garden",
  "BBQ grill",
  "Fireplace",
  "Elevator",
  "Pet friendly",
  "Smoke alarm",
];

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

type ListingDetails = {
  images: { id: number; image_url: string; display_order: number }[];
  amenities: { id: number; name: string }[];
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
  image_urls: string[];
  amenities: string[];
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
  image_urls: [""],
  amenities: [],
};

export default function HostPage() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listingDetails, setListingDetails] = useState<
    Record<number, ListingDetails>
  >({});
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  async function loadDashboard() {
    setLoading(true);

    try {
      const [listingResponse, bookingResponse] = await Promise.all([
        fetch(`${API_URL}/host/listings?host_id=${HOST_ID}`),
        fetch(`${API_URL}/host/bookings?host_id=${HOST_ID}`),
      ]);

      if (!listingResponse.ok || !bookingResponse.ok) {
        throw new Error("Unable to load the host dashboard");
      }

      const listingData: Listing[] = await listingResponse.json();
      const bookingData: Booking[] = await bookingResponse.json();

      const detailEntries = await Promise.all(
        listingData.map(async (listing) => {
          try {
            const response = await fetch(
              `${API_URL}/host/listings/${listing.id}?host_id=${HOST_ID}`
            );
            if (!response.ok) return [listing.id, { images: [], amenities: [] }] as const;
            const data = await response.json();
            return [listing.id, data] as const;
          } catch {
            return [listing.id, { images: [], amenities: [] }] as const;
          }
        })
      );

      setListings(listingData || []);
      setBookings(bookingData || []);
      setListingDetails(Object.fromEntries(detailEntries));
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

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(""), 3000);
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, image_urls: [""] });
    setShowForm(true);
  }

  async function openEdit(listing: Listing) {
    try {
      const response = await fetch(
        `${API_URL}/host/listings/${listing.id}?host_id=${HOST_ID}`
      );
      if (!response.ok) throw new Error("Unable to load listing details");

      const data = await response.json();
      const images = (data.images || []).map(
        (image: { image_url: string }) => image.image_url
      );

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
        image_urls: images.length ? images : [""],
        amenities: (data.amenities || []).map(
          (amenity: { name: string }) => amenity.name
        ),
      });
      setShowForm(true);
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to edit listing.",
        "error"
      );
    }
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateImage(index: number, value: string) {
    setForm((current) => {
      const image_urls = [...current.image_urls];
      image_urls[index] = value;
      return { ...current, image_urls };
    });
  }

  function addImage() {
    setForm((current) => ({
      ...current,
      image_urls: [...current.image_urls, ""],
    }));
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      image_urls:
        current.image_urls.length === 1
          ? [""]
          : current.image_urls.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  function toggleAmenity(name: string) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(name)
        ? current.amenities.filter((item) => item !== name)
        : [...current.amenities, name],
    }));
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

    const cleanImages = form.image_urls
      .map((url) => url.trim())
      .filter(Boolean);

    setSaving(true);

    try {
      const params = new URLSearchParams({
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

      // Always send images: if user has valid URLs send them, else send __clear__
      // so the backend knows to replace (not skip) the images list.
      if (cleanImages.length > 0) {
        cleanImages.forEach((url) => params.append("image_urls", url));
      } else if (editingId) {
        params.append("image_urls", "__clear__");
      }

      // Same for amenities — always send so deselecting all actually clears them.
      if (form.amenities.length > 0) {
        form.amenities.forEach((amenity) => params.append("amenities", amenity));
      } else if (editingId) {
        params.append("amenities", "__clear__");
      }

      const response = await fetch(
        editingId
          ? `${API_URL}/host/listings/${editingId}?${params.toString()}`
          : `${API_URL}/host/listings?${params.toString()}`,
        { method: editingId ? "PUT" : "POST" }
      );


      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.detail || "Unable to save listing.");
      }

      closeForm();
      showMessage(
        editingId ? "Listing updated successfully." : "Listing created successfully."
      );
      await loadDashboard();
    } catch (error) {
      console.error(error);
      showMessage(
        error instanceof Error ? error.message : "Unable to save listing.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/host/listings/${deleteTarget.id}?host_id=${HOST_ID}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.detail || "Unable to delete listing.");
      }
      setDeleteTarget(null);
      showMessage("Listing deleted successfully.");
      await loadDashboard();
    } catch (error) {
      console.error(error);
      showMessage(
        error instanceof Error ? error.message : "Unable to delete listing.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
    [bookings]
  );

  const averagePrice = listings.length
    ? Math.round(
      listings.reduce((sum, listing) => sum + listing.price_per_night, 0) /
      listings.length
    )
    : 0;

  function listingTitle(listingId: number) {
    return listings.find((listing) => listing.id === listingId)?.title || "Listing";
  }

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
            <button onClick={() => router.push("/")} className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100">Explore</button>
            <button onClick={() => router.push("/trips")} className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100">Trips</button>
            <button onClick={openCreate} className="hidden cursor-pointer rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-100 sm:block">Airbnb your home</button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-sm font-semibold shadow-sm">S</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Host dashboard</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your listings</h1>
            <p className="mt-2 text-sm text-gray-500">Create, manage and update every part of your property.</p>
          </div>
          <button onClick={openCreate} className="cursor-pointer rounded-xl bg-[#ff385c] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#e31c5f]">+ Add a property</button>
        </div>

        {message && (
          <div className={`fixed right-5 top-5 z-[120] rounded-xl px-5 py-3 text-sm font-medium shadow-xl ${messageType === "success" ? "bg-gray-900 text-white" : "bg-red-600 text-white"}`}>
            {message}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Active listings", listings.length, "Properties you manage"],
            ["Bookings", bookings.length, "Upcoming and historical"],
            ["Revenue", `₹${Math.round(totalRevenue).toLocaleString("en-IN")}`, "Recorded booking value"],
            ["Avg. nightly price", `₹${averagePrice.toLocaleString("en-IN")}`, "Across your listings"],
          ].map(([label, value, subtitle]) => (
            <div key={String(label)} className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          {loading ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-sm text-gray-500">Loading your properties...</div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border bg-white p-12 text-center">
              <div className="text-5xl">🏡</div>
              <h2 className="mt-4 text-xl font-semibold">Your hosting journey starts here</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">Add your first property with photos, amenities, pricing and all the details guests need.</p>
              <button onClick={openCreate} className="mt-6 cursor-pointer rounded-xl bg-[#ff385c] px-5 py-3 text-sm font-semibold text-white">Create listing</button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => {
                const details = listingDetails[listing.id];
                const cover = details?.images?.[0]?.image_url;
                return (
                  <article key={listing.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {cover ? <img src={cover} alt={listing.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">🏡</div>}
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">{listing.property_type}</span>
                      <span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm">{details?.images?.length || 0} photos</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-semibold">{listing.title}</h2>
                          <p className="mt-1 text-sm text-gray-500">{listing.location}</p>
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold">₹{listing.price_per_night.toLocaleString("en-IN")} <span className="font-normal text-gray-500">/ night</span></p>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">{listing.bedrooms} bedrooms · {listing.beds} beds · {listing.bathrooms} bathrooms · {listing.max_guests} guests</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(details?.amenities || []).slice(0, 4).map((amenity) => <span key={amenity.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{amenity.name}</span>)}
                        {(details?.amenities?.length || 0) > 4 && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">+{(details?.amenities?.length || 0) - 4}</span>}
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button onClick={() => openEdit(listing)} className="flex-1 cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">Edit</button>
                        <button onClick={() => window.open(`/listings/${listing.id}`, "_blank")} className="cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">View</button>
                        <button onClick={() => setDeleteTarget(listing)} className="cursor-pointer rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-500">Bookings</p>
            <h2 className="mt-1 text-2xl font-semibold">Recent bookings</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            {bookings.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">No bookings yet.</div>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr><th className="px-5 py-4">Property</th><th className="px-5 py-4">Dates</th><th className="px-5 py-4">Guests</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th></tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b last:border-b-0">
                      <td className="px-5 py-4 font-medium">{listingTitle(booking.listing_id)}</td>
                      <td className="px-5 py-4 text-gray-600">{booking.check_in} → {booking.check_out}</td>
                      <td className="px-5 py-4 text-gray-600">{booking.guests}</td>
                      <td className="px-5 py-4 font-semibold">₹{Number(booking.total_price).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{booking.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-medium text-gray-500">Host tools</p><h2 className="mt-1 text-2xl font-semibold">{editingId ? "Edit your listing" : "Create a new listing"}</h2></div>
              <button onClick={closeForm} className="cursor-pointer rounded-full px-3 py-2 text-xl hover:bg-gray-100">×</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-7">
              <section>
                <h3 className="text-lg font-semibold">Property details</h3>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <label className="md:col-span-2"><span className="text-sm font-semibold">Title</span><input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Beautiful lake house" className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-gray-900" /></label>
                  <label className="md:col-span-2"><span className="text-sm font-semibold">Description</span><textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={4} placeholder="Describe your place..." className="mt-2 w-full resize-none rounded-xl border px-4 py-3 outline-none focus:border-gray-900" /></label>
                  <label><span className="text-sm font-semibold">Location</span><input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Goa" className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-gray-900" /></label>
                  <label><span className="text-sm font-semibold">Property type</span><select value={form.property_type} onChange={(e) => updateField("property_type", e.target.value)} className="mt-2 w-full cursor-pointer rounded-xl border bg-white px-4 py-3 outline-none"><option>Apartment</option><option>Villa</option><option>House</option><option>Cabin</option><option>Guesthouse</option><option>Hotel</option></select></label>
                  <label><span className="text-sm font-semibold">Price per night (₹)</span><input type="number" min="1" value={form.price_per_night} onChange={(e) => updateField("price_per_night", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none" /></label>
                  <label><span className="text-sm font-semibold">Maximum guests</span><input type="number" min="1" value={form.max_guests} onChange={(e) => updateField("max_guests", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none" /></label>
                  <label><span className="text-sm font-semibold">Bedrooms</span><input type="number" min="1" value={form.bedrooms} onChange={(e) => updateField("bedrooms", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none" /></label>
                  <label><span className="text-sm font-semibold">Beds</span><input type="number" min="1" value={form.beds} onChange={(e) => updateField("beds", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none" /></label>
                  <label><span className="text-sm font-semibold">Bathrooms</span><input type="number" min="1" value={form.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 outline-none" /></label>
                </div>
              </section>

              <section className="border-t pt-6">
                <div className="flex items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Photos</h3><p className="mt-1 text-sm text-gray-500">Add as many image URLs as you want. The first photo is the cover.</p></div><button type="button" onClick={addImage} className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">+ Add photo</button></div>
                <div className="mt-4 space-y-3">
                  {form.image_urls.map((url, index) => (
                    <div key={index} className="flex gap-2"><input type="url" value={url} onChange={(e) => updateImage(index, e.target.value)} placeholder={`Image ${index + 1} URL`} className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-gray-900" />{form.image_urls.length > 1 && <button type="button" onClick={() => removeImage(index)} className="cursor-pointer rounded-xl border px-4 text-red-600 hover:bg-red-50">×</button>}</div>
                  ))}
                </div>
              </section>

              <section className="border-t pt-6">
                <div><h3 className="text-lg font-semibold">Amenities</h3><p className="mt-1 text-sm text-gray-500">Choose everything your property offers.</p></div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const selected = form.amenities.includes(amenity);
                    return <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`cursor-pointer rounded-xl border px-3 py-3 text-left text-sm transition ${selected ? "border-gray-900 bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}><span className="mr-2">{selected ? "✓" : "＋"}</span>{amenity}</button>;
                  })}
                </div>
              </section>

              <section className="border-t pt-6">
                <h3 className="text-lg font-semibold">Availability & bookings</h3>
                <p className="mt-1 text-sm text-gray-500">Guest stay dates are selected on the listing calendar. Confirmed bookings automatically block overlapping dates, so you do not need to manually enter availability here.</p>
              </section>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white pt-5">
                <button type="button" onClick={closeForm} className="cursor-pointer rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-[#ff385c] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save changes" : "Create listing"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-listing-title"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">🗑️</div>
            <h2 id="delete-listing-title" className="mt-5 text-xl font-semibold text-gray-900">Delete this listing?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              You are about to permanently delete <span className="font-semibold text-gray-900">{deleteTarget.title}</span>.
              Its bookings, reviews, favorites, amenities and photos will also be removed.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 cursor-pointer rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 cursor-pointer rounded-xl bg-[#ff385c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e31c5f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete listing"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
