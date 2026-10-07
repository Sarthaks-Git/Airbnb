"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FavoriteListing = {
  id: number;
  title: string;
  location: string;
  price_per_night: number;
  property_type: string;
  max_guests: number;
  image_url: string | null;
};

const GUEST_ID = 3;

export default function WishlistsPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/favorites/?user_id=${GUEST_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFavorites(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load wishlist:", err);
        setLoading(false);
      });
  }, []);

  async function removeFavorite(listingId: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(
        `http://127.0.0.1:8000/favorites/${listingId}?user_id=${GUEST_ID}`,
        { method: "DELETE" }
      );
      setFavorites((prev) => prev.filter((item) => item.id !== listingId));
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between border-b px-8 py-5">
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer text-2xl font-bold text-red-500 transition hover:opacity-80"
        >
          airbnb
        </button>

        <div className="flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer hover:text-red-500"
          >
            Explore
          </button>
          <button
            onClick={() => router.push("/wishlists")}
            className="cursor-pointer text-red-500 underline font-semibold"
          >
            Wishlists
          </button>
          <button
            onClick={() => router.push("/trips")}
            className="cursor-pointer hover:text-red-500"
          >
            Trips
          </button>
          <button
            onClick={() => router.push("/host")}
            className="cursor-pointer rounded-full border px-4 py-2 hover:shadow-md transition"
          >
            Switch to Host
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Wishlists</h1>
        <p className="text-gray-500 mb-8">
          Your saved properties and favorite stays.
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-gray-800">
              Your wishlist is empty
            </h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              As you search, click the heart icon on any listing to save your
              favorite places to stay.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              Start exploring
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((listing) => (
              <div
                key={listing.id}
                onClick={() => router.push(`/listings/${listing.id}`)}
                className="group cursor-pointer rounded-xl border bg-white p-3 shadow-sm hover:shadow-md transition"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 mb-3">
                  <img
                    src={
                      listing.image_url ||
                      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80"
                    }
                    alt={listing.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => removeFavorite(listing.id, e)}
                    className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-red-500 hover:scale-110 transition shadow"
                    title="Remove from wishlist"
                  >
                    ❤️
                  </button>
                </div>

                <h3 className="font-semibold text-gray-900 truncate">
                  {listing.title}
                </h3>
                <p className="text-sm text-gray-500">{listing.location}</p>
                <p className="mt-2 text-sm">
                  <span className="font-bold">₹{listing.price_per_night}</span>{" "}
                  <span className="text-gray-500">/ night</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
