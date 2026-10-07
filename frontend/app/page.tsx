"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Listing = {

  id: number;

  title: string;

  location: string;

  price_per_night: number;

  property_type: string;

  max_guests: number;

  image_url: string | null;
  image_urls?: string[];
  rating?: number | null;
  review_count?: number;

};



type GuestCounts = {

  adults: number;

  children: number;

  infants: number;

  pets: number;

};

type SearchPanel = "where" | "when" | "who" | null;


const GUEST_ID = 3;

const categories = [

  { icon: "🏠", label: "Homes" },

  { icon: "🏖️", label: "Beach" },

  { icon: "🏊", label: "Amazing pools" },

  { icon: "🌆", label: "Amazing views" },

  { icon: "🏡", label: "Countryside" },

  { icon: "🏰", label: "Castles" },

  { icon: "⛰️", label: "Mountain" },

  { icon: "🛏️", label: "Rooms" },

  { icon: "🌴", label: "Tropical" },

];



const destinations = [

  "Bhopal",

  "Mumbai",

  "Goa",

  "Udaipur",

  "Jabalpur",

  "Lucknow",

  "Jaipur",

  "Delhi",

];



const sections = [

  "Explore stays",

  "Popular homes",

  "Unique stays",

];



function getToday() {

  const today = new Date();



  return `${today.getFullYear()}-${String(

    today.getMonth() + 1

  ).padStart(2, "0")}-${String(today.getDate()).padStart(

    2,

    "0"

  )}`;

}



function formatDate(date: string) {

  if (!date) return "";



  const value = new Date(`${date}T00:00:00`);



  return value.toLocaleDateString("en-IN", {

    day: "numeric",

    month: "short",

  });

}



function getMonthData(monthOffset: number) {

  const now = new Date();



  const date = new Date(

    now.getFullYear(),

    now.getMonth() + monthOffset,

    1

  );



  const year = date.getFullYear();

  const month = date.getMonth();



  const firstDay = new Date(year, month, 1).getDay();



  const daysInMonth = new Date(

    year,

    month + 1,

    0

  ).getDate();



  const days: (number | null)[] = [];



  for (let i = 0; i < firstDay; i++) {

    days.push(null);

  }



  for (let day = 1; day <= daysInMonth; day++) {

    days.push(day);

  }



  return {

    year,

    month,

    days,

    label: date.toLocaleDateString("en-IN", {

      month: "long",

      year: "numeric",

    }),

  };

}



function dateToString(

  year: number,

  month: number,

  day: number

) {

  return `${year}-${String(month + 1).padStart(

    2,

    "0"

  )}-${String(day).padStart(2, "0")}`;

}



export default function Home() {

  const router = useRouter();



  const [listings, setListings] = useState<Listing[]>([]);

  const [loading, setLoading] = useState(true);



  const [location, setLocation] = useState("");

  const [checkIn, setCheckIn] = useState("");

  const [checkOut, setCheckOut] = useState("");



  const [guests, setGuests] = useState<GuestCounts>({

    adults: 0,

    children: 0,

    infants: 0,

    pets: 0,

  });



  const [activePanel, setActivePanel] =

    useState<SearchPanel>(null);



  const [calendarOffset, setCalendarOffset] =

    useState(0);



  const [showMenu, setShowMenu] = useState(false);

  const [showFilters, setShowFilters] = useState(false);



  const [minPrice, setMinPrice] = useState("");

  const [maxPrice, setMaxPrice] = useState("");

  const [propertyType, setPropertyType] = useState("");



  const [favorites, setFavorites] = useState<number[]>(
    []
  );

  const [isMapView, setIsMapView] = useState(false);



  const [cardIndexes, setCardIndexes] = useState<

    Record<number, number>

  >({});



  const [toast, setToast] = useState("");

  const [isCompactHeader, setIsCompactHeader] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);



  const today = getToday();



  const totalGuests =

    guests.adults + guests.children;



  const firstMonth = getMonthData(calendarOffset);

  const secondMonth = getMonthData(

    calendarOffset + 1

  );



  useEffect(() => {

    fetchListings();

    loadFavorites();



    function handleClickOutside(event: MouseEvent) {

      if (

        searchRef.current &&

        !searchRef.current.contains(

          event.target as Node

        )

      ) {

        setActivePanel(null);

      }

    }



    document.addEventListener(

      "mousedown",

      handleClickOutside

    );



    return () => {

      document.removeEventListener(

        "mousedown",

        handleClickOutside

      );

    };

  }, []);



  useEffect(() => {

    if (!toast) return;



    const timer = setTimeout(() => {

      setToast("");

    }, 2500);



    return () => clearTimeout(timer);

  }, [toast]);


  useEffect(() => {
    let frameId: number | null = null;

    const handleScroll = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        const shouldCompact = window.scrollY > 120;

        setIsCompactHeader((current) =>
          current === shouldCompact ? current : shouldCompact
        );

        frameId = null;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);



  async function fetchListings() {

    setLoading(true);



    try {

      const params = new URLSearchParams();



      params.set("limit", "50");



      if (location.trim()) {

        params.set(

          "location",

          location.trim()

        );

      }



      if (totalGuests > 0) {

        params.set(

          "guests",

          String(totalGuests)

        );

      }



      if (checkIn) {

        params.set("check_in", checkIn);

      }



      if (checkOut) {

        params.set("check_out", checkOut);

      }



      if (minPrice) {

        params.set("min_price", minPrice);

      }



      if (maxPrice) {

        params.set("max_price", maxPrice);

      }



      if (propertyType) {

        params.set(

          "property_type",

          propertyType

        );

      }



      const response = await fetch(

        `${API_URL}/listings/?${params.toString()}`

      );



      if (!response.ok) {

        throw new Error(

          "Failed to fetch listings"

        );

      }



      const data = await response.json();



      setListings(data.items || []);

    } catch (error) {

      console.error(error);

      setListings([]);

    } finally {

      setLoading(false);

    }

  }



  async function loadFavorites() {

    try {

      const response = await fetch(

        `${API_URL}/favorites/?user_id=${GUEST_ID}`

      );



      if (!response.ok) return;



      const data = await response.json();



      setFavorites(

        data.map(

          (item: Listing) => item.id

        )

      );

    } catch (error) {

      console.error(error);

    }

  }



  async function toggleFavorite(

    event: React.MouseEvent,

    listingId: number

  ) {

    event.stopPropagation();



    const isFavorite =

      favorites.includes(listingId);



    try {

      const response = await fetch(

        `${API_URL}/favorites/${listingId}?user_id=${GUEST_ID}`,

        {

          method: isFavorite

            ? "DELETE"

            : "POST",

        }

      );



      if (!response.ok) {

        throw new Error(

          "Favorite request failed"

        );

      }



      setFavorites((current) =>

        isFavorite

          ? current.filter(

            (id) => id !== listingId

          )

          : [...current, listingId]

      );



      setToast(

        isFavorite

          ? "Removed from your wishlist"

          : "Added to your wishlist"

      );

    } catch (error) {

      console.error(error);

    }

  }



  function togglePanel(panel: SearchPanel) {

    setActivePanel((current) =>

      current === panel ? null : panel

    );



    setShowMenu(false);

  }



  function updateGuest(

    type: keyof GuestCounts,

    amount: number

  ) {

    setGuests((current) => {

      const next = Math.max(

        0,

        current[type] + amount

      );



      return {

        ...current,

        [type]: next,

      };

    });

  }



  function selectDestination(

    value: string

  ) {

    setLocation(value);

    setActivePanel("when");

  }



  function handleDateClick(

    year: number,

    month: number,

    day: number

  ) {

    const selected = dateToString(

      year,

      month,

      day

    );



    if (selected < today) return;



    if (

      !checkIn ||

      (checkIn && checkOut)

    ) {

      setCheckIn(selected);

      setCheckOut("");

      return;

    }



    if (selected <= checkIn) {

      setCheckIn(selected);

      setCheckOut("");

      return;

    }



    setCheckOut(selected);

    setActivePanel("who");

  }



  function handleSearch() {

    if (

      checkIn &&

      checkOut &&

      checkOut <= checkIn

    ) {

      setToast(

        "Check-out must be after check-in."

      );

      return;

    }



    if (

      minPrice &&

      maxPrice &&

      Number(minPrice) >

      Number(maxPrice)

    ) {

      setToast(

        "Maximum price must be greater than minimum price."

      );

      return;

    }



    setActivePanel(null);

    fetchListings();

  }



  function clearFilters() {

    setMinPrice("");

    setMaxPrice("");

    setPropertyType("");



    setTimeout(() => {

      fetchListings();

    }, 0);

  }



  function clearDates() {

    setCheckIn("");

    setCheckOut("");

  }



  function nextCalendar() {

    setCalendarOffset(

      (current) => current + 1

    );

  }



  function previousCalendar() {

    setCalendarOffset((current) =>

      Math.max(0, current - 1)

    );

  }



  function changeCardImage(
    event: React.MouseEvent,
    listingId: number,
    direction: number,
    imageCount: number
  ) {
    event.stopPropagation();

    if (imageCount <= 1) return;

    setCardIndexes((current) => {
      const currentIndex = current[listingId] || 0;
      const nextIndex =
        (currentIndex + direction + imageCount) % imageCount;

      return {
        ...current,
        [listingId]: nextIndex,
      };
    });
  }

  function openListing(

    listingId: number

  ) {

    window.open(

      `/listings/${listingId}`,

      "_blank"

    );

  }



  const groupedListings = useMemo(() => {

    if (listings.length === 0) {

      return [];

    }



    return sections.map(

      (title, sectionIndex) => ({

        title,

        listings: listings.map(

          (listing, index) => ({

            ...listing,

            displayIndex:

              index + sectionIndex,

          })

        ),

      })

    );

  }, [listings]);



  function renderCalendar(

    calendar: ReturnType<

      typeof getMonthData

    >

  ) {

    return (

      <div className="min-w-[290px] flex-1">

        <div className="mb-5 text-center text-sm font-semibold">

          {calendar.label}

        </div>



        <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-gray-500">

          {[

            "S",

            "M",

            "T",

            "W",

            "T",

            "F",

            "S",

          ].map((day, index) => (

            <span

              key={`${day}-${index}`}

            >

              {day}

            </span>

          ))}

        </div>



        <div className="grid grid-cols-7 gap-y-2">

          {calendar.days.map(

            (day, index) => {

              if (!day) {

                return (

                  <div

                    key={`empty-${index}`}

                    className="h-10"

                  />

                );

              }



              const dateValue =

                dateToString(

                  calendar.year,

                  calendar.month,

                  day

                );



              const disabled =

                dateValue < today;



              const selected =

                dateValue === checkIn ||

                dateValue === checkOut;



              const inRange =

                checkIn &&

                checkOut &&

                dateValue > checkIn &&

                dateValue < checkOut;



              return (

                <button

                  key={dateValue}

                  disabled={disabled}

                  onClick={() =>

                    handleDateClick(

                      calendar.year,

                      calendar.month,

                      day

                    )

                  }

                  className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition ${disabled

                      ? "cursor-not-allowed text-gray-300"

                      : "cursor-pointer hover:bg-gray-100"

                    } ${selected

                      ? "bg-gray-900 text-white hover:bg-gray-900"

                      : ""

                    } ${inRange

                      ? "rounded-none bg-gray-100 text-gray-900"

                      : ""

                    }`}

                >

                  {day}

                </button>

              );

            }

          )}

        </div>

      </div>

    );

  }



  return (

    <main className="min-h-screen bg-white text-gray-900">

      {/* =====================================================

          HEADER

      ===================================================== */}



      <header className="sticky top-0 z-40 border-b bg-white">

        <div className="mx-auto max-w-[1440px] px-6">

          <div className="flex items-center justify-between py-5">

            {/* LOGO */}



            <button

              onClick={() =>

                router.push("/")

              }

              className="cursor-pointer text-2xl font-bold tracking-tight text-[#ff385c]"

            >

              airbnb

            </button>



            {/* CATEGORIES */}



            <div
              className={`hidden items-center gap-8 md:flex transition-all duration-300 ease-out ${isCompactHeader
                  ? "pointer-events-none scale-95 opacity-0"
                  : "scale-100 opacity-100"
                }`}
            >

              <button className="flex cursor-pointer flex-col items-center gap-1 border-b-2 border-gray-900 pb-2 text-sm font-semibold">

                <span className="text-xl">

                  🌐

                </span>

                All

              </button>



              <button className="flex cursor-pointer flex-col items-center gap-1 text-sm text-gray-500 hover:text-gray-900">

                <span className="text-xl">

                  🏠

                </span>

                Homes

              </button>



              <button

                onClick={() =>

                  setToast(

                    "Experiences are coming soon"

                  )

                }

                className="flex cursor-pointer flex-col items-center gap-1 text-sm text-gray-500 hover:text-gray-900"

              >

                <span className="text-xl">

                  🎈

                </span>

                Experiences

              </button>



              <button

                onClick={() =>

                  setToast(

                    "Services are coming soon"

                  )

                }

                className="flex cursor-pointer flex-col items-center gap-1 text-sm text-gray-500 hover:text-gray-900"

              >

                <span className="text-xl">

                  🍽️

                </span>

                Services

              </button>

            </div>



            {/* RIGHT NAV */}



            <div className="flex items-center gap-3">

              <button

                onClick={() =>

                  router.push("/host")

                }

                className="hidden cursor-pointer rounded-full px-4 py-3 text-sm font-medium hover:bg-gray-100 md:block"

              >

                Airbnb your home

              </button>



              <button

                onClick={() =>

                  setShowMenu(

                    (current) => !current

                  )

                }

                className="flex h-11 cursor-pointer items-center gap-2 rounded-full border px-3 shadow-sm hover:shadow-md"

              >

                <span className="text-lg">

                  ☰

                </span>



                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">

                  S

                </span>

              </button>

              {showMenu && (
                <div ref={menuRef} className="absolute right-0 top-14 w-80 max-h-[calc(100vh-180px)] overflow-y-auto rounded-2xl border bg-white shadow-xl z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold text-gray-900">Signed in as Guest</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <span className="text-green-600 font-bold">✓</span> Identity Verified
                    </p>
                  </div>

                  <div className="py-2">
                    <button onClick={() => { setShowMenu(false); router.push("/wishlists"); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-100 transition">
                      <span className="font-semibold">Wishlists</span>
                      <span>❤️</span>
                    </button>
                    <button onClick={() => { setShowMenu(false); router.push("/trips"); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-100 transition">
                      <span className="font-semibold">Trips</span>
                      <span>✈️</span>
                    </button>
                    <button onClick={() => { setShowMenu(false); setToast("Messages coming soon"); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-100 transition">
                      <span className="font-semibold">Messages</span>
                      <span>💬</span>
                    </button>
                  </div>

                  <div className="border-t" />

                  <div className="py-2">
                    <button onClick={() => { setShowMenu(false); router.push("/host"); }} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-100 transition">
                      <span className="font-semibold">Switch to Host</span>
                      <span className="text-xs rounded bg-gray-100 px-2 py-1 font-semibold border">Host Portal</span>
                    </button>
                    <button onClick={() => { setShowMenu(false); setToast("Account settings coming soon"); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 transition">
                      Account settings
                    </button>
                    <button onClick={() => { setShowMenu(false); setToast("Help Centre coming soon"); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 transition">
                      Help Centre
                    </button>
                  </div>

                  <div className="border-t" />

                  <div className="py-2">
                    <button onClick={() => { setShowMenu(false); setToast("Logged out"); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 transition">
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>



          {/* =================================================

              SEARCH BAR

          ================================================= */}



          <div

            ref={searchRef}

            className={`relative mx-auto max-w-4xl overflow-hidden transition-[max-height,opacity,transform,margin] duration-300 ease-out ${isCompactHeader
                ? "pointer-events-none mb-0 max-h-0 -translate-y-2 opacity-0"
                : "mb-5 max-h-28 translate-y-0 opacity-100"
              }`}

          >

            <div className="flex items-center rounded-full border bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">

              {/* WHERE */}



              <button

                onClick={() =>

                  togglePanel("where")

                }

                className={`flex min-w-0 flex-1 cursor-pointer flex-col rounded-full px-7 py-4 text-left ${activePanel === "where"

                    ? "bg-white shadow-lg"

                    : "hover:bg-gray-100"

                  }`}

              >

                <span className="text-xs font-semibold">

                  Where

                </span>



                <span className="mt-1 truncate text-sm text-gray-500">

                  {location ||

                    "Search destinations"}

                </span>

              </button>



              <div className="h-8 w-px bg-gray-200" />



              {/* WHEN */}



              <button

                onClick={() =>

                  togglePanel("when")

                }

                className={`flex min-w-0 flex-1 cursor-pointer flex-col rounded-full px-7 py-4 text-left ${activePanel === "when"

                    ? "bg-white shadow-lg"

                    : "hover:bg-gray-100"

                  }`}

              >

                <span className="text-xs font-semibold">

                  When

                </span>



                <span className="mt-1 text-sm text-gray-500">

                  {checkIn

                    ? checkOut

                      ? `${formatDate(

                        checkIn

                      )} – ${formatDate(

                        checkOut

                      )}`

                      : formatDate(checkIn)

                    : "Add dates"}

                </span>

              </button>



              <div className="h-8 w-px bg-gray-200" />



              {/* WHO */}



              <button

                onClick={() =>

                  togglePanel("who")

                }

                className={`flex min-w-0 flex-1 cursor-pointer flex-col rounded-full px-7 py-4 text-left ${activePanel === "who"

                    ? "bg-white shadow-lg"

                    : "hover:bg-gray-100"

                  }`}

              >

                <span className="text-xs font-semibold">

                  Who

                </span>



                <span className="mt-1 text-sm text-gray-500">

                  {totalGuests > 0

                    ? `${totalGuests} guests`

                    : "Add guests"}

                </span>

              </button>



              {/* SEARCH BUTTON */}



              <button

                onClick={handleSearch}

                className="mr-2 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#ff385c] text-xl text-white transition duration-200 hover:scale-105"

                aria-label="Search"

              >

                🔍

              </button>

            </div>



            {/* =============================================

                WHERE PANEL

            ============================================= */}



            {activePanel === "where" && (

              <div className="absolute left-0 top-[72px] z-50 w-[420px] rounded-3xl bg-white p-7 shadow-xl">

                <h3 className="text-sm font-semibold">
                  Search destinations
                </h3>

                <input
                  autoFocus
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && location.trim()) {
                      setActivePanel("when");
                    }
                  }}
                  placeholder="Search destinations"
                  className="mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                />

                <div className="mt-5 space-y-2">

                  {destinations.map(

                    (destination) => (

                      <button

                        key={destination}

                        onClick={() =>

                          selectDestination(

                            destination

                          )

                        }

                        className="flex w-full cursor-pointer items-center gap-4 rounded-xl p-3 text-left hover:bg-gray-100"

                      >

                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl">

                          📍

                        </span>



                        <span>

                          <span className="block text-sm font-semibold">

                            {destination}

                          </span>



                          <span className="text-xs text-gray-500">

                            Search stays in{" "}

                            {destination}

                          </span>

                        </span>

                      </button>

                    )

                  )}

                </div>

              </div>

            )}



            {/* =============================================

                WHEN PANEL

            ============================================= */}



            {activePanel === "when" && (

              <div className="absolute left-1/2 top-[72px] z-50 w-[760px] -translate-x-1/2 rounded-3xl bg-white p-7 shadow-xl">

                <div className="mb-6 flex justify-center">

                  <div className="flex rounded-full bg-gray-100 p-1">

                    <button className="cursor-pointer rounded-full bg-white px-8 py-2 text-sm font-semibold shadow-sm">

                      Dates

                    </button>



                    <button

                      onClick={() =>

                        setToast(

                          "Flexible dates are coming soon"

                        )

                      }

                      className="cursor-pointer rounded-full px-8 py-2 text-sm text-gray-600"

                    >

                      Flexible

                    </button>

                  </div>

                </div>



                <div className="flex items-center gap-6">

                  <button

                    onClick={

                      previousCalendar

                    }

                    disabled={

                      calendarOffset === 0

                    }

                    className="cursor-pointer text-2xl disabled:cursor-not-allowed disabled:text-gray-300"

                  >

                    ‹

                  </button>



                  {renderCalendar(

                    firstMonth

                  )}



                  {renderCalendar(

                    secondMonth

                  )}



                  <button

                    onClick={nextCalendar}

                    className="cursor-pointer text-2xl"

                  >

                    ›

                  </button>

                </div>



                {(checkIn || checkOut) && (

                  <div className="mt-6 flex items-center justify-between border-t pt-5">

                    <div className="text-sm">

                      {checkIn &&

                        `Check-in: ${formatDate(

                          checkIn

                        )}`}



                      {checkOut &&

                        ` · Check-out: ${formatDate(

                          checkOut

                        )}`}

                    </div>



                    <button

                      onClick={clearDates}

                      className="cursor-pointer text-sm font-semibold underline"

                    >

                      Clear dates

                    </button>

                  </div>

                )}

              </div>

            )}



            {/* =============================================

                WHO PANEL

            ============================================= */}



            {activePanel === "who" && (

              <div className="absolute right-0 top-[72px] z-50 w-[390px] rounded-3xl bg-white p-7 shadow-xl">

                {[

                  {

                    key: "adults" as const,

                    title: "Adults",

                    subtitle:

                      "Ages 13 or above",

                  },

                  {

                    key: "children" as const,

                    title: "Children",

                    subtitle:

                      "Ages 2–12",

                  },

                  {

                    key: "infants" as const,

                    title: "Infants",

                    subtitle:

                      "Under 2",

                  },

                  {

                    key: "pets" as const,

                    title: "Pets",

                    subtitle:

                      "Bringing a service animal?",

                  },

                ].map((item, index) => (

                  <div

                    key={item.key}

                    className={`flex items-center justify-between py-5 ${index !== 3

                        ? "border-b"

                        : ""

                      }`}

                  >

                    <div>

                      <div className="font-semibold">

                        {item.title}

                      </div>



                      <div className="mt-1 text-sm text-gray-500">

                        {item.subtitle}

                      </div>

                    </div>



                    <div className="flex items-center gap-4">

                      <button

                        onClick={() =>

                          updateGuest(

                            item.key,

                            -1

                          )

                        }

                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-lg text-gray-500 hover:border-gray-900"

                      >

                        −

                      </button>



                      <span className="w-4 text-center">

                        {guests[item.key]}

                      </span>



                      <button

                        onClick={() =>

                          updateGuest(

                            item.key,

                            1

                          )

                        }

                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-lg text-gray-500 hover:border-gray-900"

                      >

                        +

                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>



        </div>

      </header>



      {/* =====================================================

          CATEGORY ROW

      ===================================================== */}



      <div className="border-b bg-white">

        <div className="mx-auto flex max-w-[1440px] gap-8 overflow-x-auto px-6 py-4">

          {categories.map(

            (category, index) => (

              <button

                key={category.label}

                onClick={() => {

                  if (

                    category.label ===

                    "Homes"

                  ) {

                    setPropertyType("");

                    fetchListings();

                  } else {

                    setToast(

                      `${category.label} category selected`

                    );

                  }

                }}

                className={`flex min-w-fit cursor-pointer flex-col items-center gap-1 border-b-2 pb-2 text-xs transition ${index === 0

                    ? "border-gray-900 font-semibold"

                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900"

                  }`}

              >

                <span className="text-xl">

                  {category.icon}

                </span>



                {category.label}

              </button>

            )

          )}

        </div>

      </div>



      {/* =====================================================

          FILTER BAR

      ===================================================== */}



      <section className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5">

        <div>

          <span className="text-sm text-gray-500">

            {listings.length} stays

          </span>

        </div>



        <button

          onClick={() =>

            setShowFilters(

              (current) => !current

            )

          }

          className="flex cursor-pointer items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold hover:shadow-sm"

        >

          ⚙ Filters

        </button>

      </section>



      {showFilters && (

        <section className="mx-auto max-w-[1440px] px-6 pb-6">

          <div className="rounded-3xl border p-6 shadow-sm">

            <div className="grid gap-6 md:grid-cols-3">

              <div>

                <label className="text-sm font-semibold">

                  Minimum price

                </label>



                <div className="mt-2 flex rounded-xl border px-4 py-3">

                  <span>₹</span>



                  <input

                    type="number"

                    min="0"

                    value={minPrice}

                    onChange={(event) =>

                      setMinPrice(

                        event.target.value

                      )

                    }

                    placeholder="Any"

                    className="ml-2 w-full outline-none"

                  />

                </div>

              </div>



              <div>

                <label className="text-sm font-semibold">

                  Maximum price

                </label>



                <div className="mt-2 flex rounded-xl border px-4 py-3">

                  <span>₹</span>



                  <input

                    type="number"

                    min="0"

                    value={maxPrice}

                    onChange={(event) =>

                      setMaxPrice(

                        event.target.value

                      )

                    }

                    placeholder="Any"

                    className="ml-2 w-full outline-none"

                  />

                </div>

              </div>



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

                  className="mt-2 w-full cursor-pointer rounded-xl border bg-white px-4 py-3 outline-none"

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



            <div className="mt-6 flex justify-end gap-3">

              <button

                onClick={clearFilters}

                className="cursor-pointer rounded-full border px-6 py-3 text-sm font-semibold"

              >

                Clear all

              </button>



              <button

                onClick={() => {

                  handleSearch();

                  setShowFilters(false);

                }}

                className="cursor-pointer rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white"

              >

                Show stays

              </button>

            </div>

          </div>

        </section>

      )}



      {/* =====================================================

          LISTINGS

      ===================================================== */}



      <section className="mx-auto max-w-[1440px] px-6 pb-20">

        {loading ? (

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">

            {Array.from({ length: 12 }).map(

              (_, index) => (

                <div key={index}>

                  <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />



                  <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-gray-200" />



                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />

                </div>

              )

            )}

          </div>

        ) : listings.length === 0 ? (

          <div className="mx-auto max-w-xl py-24 text-center">

            <div className="text-6xl">

              🏡

            </div>



            <h2 className="mt-6 text-2xl font-semibold">

              No stays found

            </h2>



            <p className="mt-3 text-gray-500">

              Try changing your destination,

              dates, guests, or filters.

            </p>



            <button

              onClick={() => {

                setLocation("");

                clearDates();



                setGuests({

                  adults: 0,

                  children: 0,

                  infants: 0,

                  pets: 0,

                });



                clearFilters();

              }}

              className="mt-6 cursor-pointer rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white"

            >

              Clear search

            </button>

          </div>

        ) : isMapView ? (
          <div className="h-[70vh] w-full rounded-2xl bg-gray-100 overflow-hidden relative shadow-inner border mb-12">
            <div className="absolute inset-0 z-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=India&zoom=5&size=1200x800&scale=2&maptype=roadmap&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:administrative|element:geometry.stroke|color:0xcbd1d1&style=feature:landscape|element:geometry|color:0xf5f5f5&style=feature:water|element:geometry|color:0xc9c9c9')] bg-cover bg-center opacity-80 mix-blend-multiply"></div>

            {listings.map((listing, i) => (
              <div
                key={listing.id}
                onClick={() => openListing(listing.id)}
                className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform shadow-lg hover:z-50"
                style={{
                  top: `${15 + (i * 17) % 70}%`,
                  left: `${20 + (i * 31) % 60}%`
                }}
              >
                <div className="bg-white px-3 py-1.5 rounded-2xl shadow-md text-sm font-bold flex items-center hover:bg-black hover:text-white transition-colors border border-gray-200">
                  ₹{listing.price_per_night}
                </div>
              </div>
            ))}
          </div>
        ) : (
          groupedListings.map(

            (

              section,

              sectionIndex

            ) => (

              <div

                key={section.title}

                className="mb-12"

              >

                <div className="mb-5 flex items-center justify-between">

                  <h2 className="text-xl font-semibold">

                    {section.title}



                    {sectionIndex === 0 &&

                      location &&

                      ` in ${location}`}

                  </h2>



                  <div className="flex gap-2">

                    <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-sm hover:bg-gray-200">

                      ‹

                    </button>



                    <button className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-sm hover:bg-gray-200">

                      ›

                    </button>

                  </div>

                </div>



                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">

                  {section.listings.map(

                    (

                      listing,

                      index

                    ) => {

                      const imageIndex =

                        cardIndexes[

                        listing.id

                        ] || 0;



                      const imageUrls =
                        listing.image_urls && listing.image_urls.length > 0
                          ? listing.image_urls
                          : listing.image_url
                            ? [listing.image_url]
                            : ["/placeholder.jpg"];

                      const safeImageIndex = imageIndex % imageUrls.length;
                      const image = imageUrls[safeImageIndex];

                      const rating =
                        listing.rating !== null &&
                          listing.rating !== undefined
                          ? listing.rating.toFixed(1)
                          : "New";



                      return (

                        <article

                          key={`${sectionIndex}-${listing.id}`}

                          onClick={() =>

                            openListing(

                              listing.id

                            )

                          }

                          className="group cursor-pointer"

                        >

                          <div className="relative overflow-hidden rounded-2xl">

                            <img

                              src={image}

                              alt={

                                listing.title

                              }

                              className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02]"

                            />



                            {index % 3 ===

                              0 && (

                                <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">

                                  Guest favourite

                                </span>

                              )}



                            <button

                              onClick={(

                                event

                              ) =>

                                toggleFavorite(

                                  event,

                                  listing.id

                                )

                              }

                              className="absolute right-3 top-3 cursor-pointer text-2xl text-white drop-shadow-md transition hover:scale-110"

                              aria-label="Wishlist"

                            >

                              {favorites.includes(

                                listing.id

                              )

                                ? "♥"

                                : "♡"}

                            </button>



                            <button

                              onClick={(

                                event

                              ) =>

                                changeCardImage(
                                  event,
                                  listing.id,
                                  -1,
                                  imageUrls.length
                                )

                              }

                              className="absolute left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-lg shadow group-hover:flex"

                            >

                              ‹

                            </button>



                            <button

                              onClick={(

                                event

                              ) =>

                                changeCardImage(
                                  event,
                                  listing.id,
                                  1,
                                  imageUrls.length
                                )

                              }

                              className="absolute right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-lg shadow group-hover:flex"

                            >

                              ›

                            </button>



                            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">

                              {imageUrls.map((_, dot) => (

                                <span

                                  key={

                                    dot

                                  }

                                  className={`h-1.5 w-1.5 rounded-full ${dot ===

                                      imageIndex

                                      ? "bg-white"

                                      : "bg-white/50"

                                    }`}

                                />

                              )

                              )}

                            </div>

                          </div>



                          <div className="mt-3">

                            <div className="flex items-start justify-between gap-2">

                              <h3 className="truncate text-sm font-semibold">

                                {

                                  listing.title

                                }

                              </h3>



                              <span className="shrink-0 text-sm">
                                ★{" "}
                                {rating}
                                {listing.review_count !== undefined &&
                                  listing.review_count > 0 && (
                                    <span className="ml-1 text-gray-500">
                                      ({listing.review_count})
                                    </span>
                                  )}
                              </span>

                            </div>



                            <p className="mt-1 truncate text-sm text-gray-500">

                              {

                                listing.location

                              }

                            </p>



                            <p className="mt-2 text-sm">

                              <span className="font-semibold">

                                ₹

                                {listing.price_per_night.toLocaleString(

                                  "en-IN"

                                )}

                              </span>{" "}

                              night

                            </p>

                          </div>

                        </article>

                      );

                    }

                  )}

                </div>

              </div>

            )

          )

        )}

      </section>



      {/* =====================================================

          FOOTER

      ===================================================== */}



      <footer className="border-t bg-gray-50">

        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-12 md:grid-cols-3">

          <div>

            <h3 className="font-semibold">

              Support

            </h3>



            <div className="mt-5 space-y-3 text-sm text-gray-600">

              <p>Help Centre</p>

              <p>Safety information</p>

              <p>Cancellation options</p>

              <p>AirCover</p>

              <p>Accessibility</p>

            </div>

          </div>



          <div>

            <h3 className="font-semibold">

              Hosting

            </h3>



            <div className="mt-5 space-y-3 text-sm text-gray-600">

              <button

                onClick={() =>

                  router.push("/host")

                }

                className="block cursor-pointer hover:underline"

              >

                Airbnb your home

              </button>



              <p>Hosting resources</p>

              <p>Community forum</p>

              <p>Hosting responsibly</p>

              <p>Find a co-host</p>

            </div>

          </div>



          <div>

            <h3 className="font-semibold">

              Airbnb

            </h3>



            <div className="mt-5 space-y-3 text-sm text-gray-600">

              <p>

                2026 Summer Release

              </p>



              <p>Newsroom</p>

              <p>Careers</p>

              <p>Investors</p>

            </div>

          </div>

        </div>



        <div className="border-t">

          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 px-6 py-6 text-sm text-gray-500 md:flex-row">

            <span>

              © 2026 Airbnb Clone · Privacy ·

              Terms

            </span>



            <span>

              🌐 English (IN) · ₹ INR

            </span>

          </div>

        </div>

      </footer>



      {/* =====================================================

          TOAST

      ===================================================== */}



      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-gray-900 px-6 py-4 text-sm font-medium text-white shadow-xl transition-all duration-300">
          {toast}
        </div>
      )}

      {/* Map Toggle Button */}
      <div className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2">
        <button
          onClick={() => setIsMapView(!isMapView)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-gray-900 px-5 py-3.5 text-sm font-semibold text-white shadow-xl hover:scale-105 hover:bg-black transition-transform"
        >
          {isMapView ? (
            <>
              Show list <span className="text-lg">📋</span>
            </>
          ) : (
            <>
              Show map <span className="text-lg">🗺️</span>
            </>
          )}
        </button>
      </div>

    </main>

  );

}