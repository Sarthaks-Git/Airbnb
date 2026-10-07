from datetime import date
from sqlalchemy.orm import Session

from database import SessionLocal
from models import (
    User,
    Listing,
    ListingImage,
    Amenity,
    ListingAmenity,
    Review,
    Booking,
)

# This script is safe to run multiple times.
# It only creates a listing when its title does not already exist.

LISTINGS = [
    {
        "host_id": 1,
        "title": "Luxury Lake View Villa",
        "description": "A peaceful villa overlooking the lake with spacious interiors, a private balcony and beautiful sunset views.",
        "location": "Udaipur, Rajasthan",
        "property_type": "Villa",
        "price_per_night": 7200,
        "max_guests": 6,
        "bedrooms": 3,
        "beds": 4,
        "bathrooms": 3,
        "latitude": 24.5854,
        "longitude": 73.7125,
        "images": [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "Free parking", "Pool", "TV"],
    },
    {
        "host_id": 2,
        "title": "Beachfront Escape in Goa",
        "description": "Relax beside the sea in this bright coastal home, close to beaches, cafes and nightlife.",
        "location": "Goa, India",
        "property_type": "Villa",
        "price_per_night": 8500,
        "max_guests": 6,
        "bedrooms": 3,
        "beds": 4,
        "bathrooms": 3,
        "latitude": 15.2993,
        "longitude": 74.1240,
        "images": [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
            "https://images.unsplash.com/photo-1600607688969-a5bfcd646154",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "Pool", "TV"],
    },
    {
        "host_id": 1,
        "title": "Modern City Apartment",
        "description": "A stylish apartment in the heart of Mumbai with fast WiFi, a modern kitchen and easy city access.",
        "location": "Mumbai, Maharashtra",
        "property_type": "Apartment",
        "price_per_night": 4800,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 2,
        "latitude": 19.0760,
        "longitude": 72.8777,
        "images": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "TV"],
    },
    {
        "host_id": 2,
        "title": "Heritage Haveli Stay",
        "description": "Experience old-world Rajasthan charm in a restored haveli with traditional details and modern comforts.",
        "location": "Jaipur, Rajasthan",
        "property_type": "House",
        "price_per_night": 3900,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 3,
        "bathrooms": 2,
        "latitude": 26.9124,
        "longitude": 75.7873,
        "images": [
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
            "https://images.unsplash.com/photo-1600607688960-e095ff83135c",
        ],
        "amenities": ["WiFi", "Air conditioning", "Free parking", "TV"],
    },
    {
        "host_id": 1,
        "title": "Hillside Retreat",
        "description": "A cozy mountain home surrounded by pine trees with peaceful views and a warm, relaxing atmosphere.",
        "location": "Manali, Himachal Pradesh",
        "property_type": "House",
        "price_per_night": 5200,
        "max_guests": 5,
        "bedrooms": 2,
        "beds": 3,
        "bathrooms": 2,
        "latitude": 32.2432,
        "longitude": 77.1892,
        "images": [
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739",
            "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739",
        ],
        "amenities": ["WiFi", "Kitchen", "Free parking", "TV"],
    },
    {
        "host_id": 2,
        "title": "Riverside Cottage",
        "description": "A quiet riverside cottage ideal for a slow weekend away, with a private garden and outdoor seating.",
        "location": "Rishikesh, Uttarakhand",
        "property_type": "House",
        "price_per_night": 3600,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 1,
        "latitude": 30.0869,
        "longitude": 78.2676,
        "images": [
            "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
            "https://images.unsplash.com/photo-1449844908441-8829872d2607",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
        ],
        "amenities": ["WiFi", "Kitchen", "Free parking"],
    },
    {
        "host_id": 1,
        "title": "Lakefront Wooden Cabin",
        "description": "A warm wooden cabin with lake views, a cozy living room and everything needed for a peaceful getaway.",
        "location": "Nainital, Uttarakhand",
        "property_type": "House",
        "price_per_night": 4600,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 2,
        "latitude": 29.3919,
        "longitude": 79.4542,
        "images": [
            "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739",
            "https://images.unsplash.com/photo-1449844908441-8829872d2607",
        ],
        "amenities": ["WiFi", "Kitchen", "Free parking", "TV"],
    },
    {
        "host_id": 2,
        "title": "Contemporary Home in Delhi",
        "description": "A comfortable modern home close to major attractions, restaurants and transport links.",
        "location": "New Delhi, India",
        "property_type": "Apartment",
        "price_per_night": 4300,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 2,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "images": [
            "https://images.unsplash.com/photo-1494526585095-c41746248156",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "TV"],
    },
    {
        "host_id": 1,
        "title": "Peaceful Bhopal Garden Home",
        "description": "A bright family home with a garden, comfortable bedrooms and a calm neighborhood atmosphere.",
        "location": "Bhopal, Madhya Pradesh",
        "property_type": "House",
        "price_per_night": 2800,
        "max_guests": 5,
        "bedrooms": 2,
        "beds": 3,
        "bathrooms": 2,
        "latitude": 23.2599,
        "longitude": 77.4126,
        "images": [
            "https://images.unsplash.com/photo-1560185008-b033106af5c3",
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0",
            "https://images.unsplash.com/photo-1560184897-ae75f418493e",
        ],
        "amenities": ["WiFi", "Kitchen", "Free parking", "TV"],
    },
    {
        "host_id": 2,
        "title": "Elegant Lucknow Residency",
        "description": "A spacious and elegant stay close to Lucknow's historic areas and famous food streets.",
        "location": "Lucknow, Uttar Pradesh",
        "property_type": "Apartment",
        "price_per_night": 3200,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 2,
        "latitude": 26.8467,
        "longitude": 80.9462,
        "images": [
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
            "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "TV"],
    },
    {
        "host_id": 1,
        "title": "Royal Udaipur Courtyard",
        "description": "A character-filled courtyard home blending traditional architecture with modern interiors.",
        "location": "Udaipur, Rajasthan",
        "property_type": "House",
        "price_per_night": 5400,
        "max_guests": 5,
        "bedrooms": 2,
        "beds": 3,
        "bathrooms": 2,
        "latitude": 24.5854,
        "longitude": 73.7125,
        "images": [
            "https://images.unsplash.com/photo-1600607688969-a5bfcd646154",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "Free parking"],
    },
    {
        "host_id": 2,
        "title": "Coastal Studio Near Candolim",
        "description": "A compact and stylish studio perfect for couples looking to explore North Goa.",
        "location": "Goa, India",
        "property_type": "Apartment",
        "price_per_night": 3300,
        "max_guests": 2,
        "bedrooms": 1,
        "beds": 1,
        "bathrooms": 1,
        "latitude": 15.5162,
        "longitude": 73.7626,
        "images": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "Pool"],
    },
    {
        "host_id": 1,
        "title": "Minimalist Pune Loft",
        "description": "A clean modern loft with excellent workspace, fast WiFi and easy access to Pune's best neighborhoods.",
        "location": "Pune, Maharashtra",
        "property_type": "Apartment",
        "price_per_night": 3500,
        "max_guests": 3,
        "bedrooms": 1,
        "beds": 2,
        "bathrooms": 1,
        "latitude": 18.5204,
        "longitude": 73.8567,
        "images": [
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "TV"],
    },
    {
        "host_id": 2,
        "title": "Garden Villa in Jabalpur",
        "description": "A spacious villa with a private garden, ideal for families visiting Jabalpur and nearby attractions.",
        "location": "Jabalpur, Madhya Pradesh",
        "property_type": "Villa",
        "price_per_night": 4100,
        "max_guests": 6,
        "bedrooms": 3,
        "beds": 4,
        "bathrooms": 2,
        "latitude": 23.1815,
        "longitude": 79.9864,
        "images": [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
            "https://images.unsplash.com/photo-1600607688969-a5bfcd646154",
        ],
        "amenities": ["WiFi", "Kitchen", "Free parking", "Pool", "TV"],
    },
    {
        "host_id": 1,
        "title": "Sunset Apartment in Hyderabad",
        "description": "A modern apartment with skyline views, a comfortable workspace and easy access to Hyderabad's tech district.",
        "location": "Hyderabad, Telangana",
        "property_type": "Apartment",
        "price_per_night": 3800,
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 2,
        "latitude": 17.3850,
        "longitude": 78.4867,
        "images": [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
        ],
        "amenities": ["WiFi", "Kitchen", "Air conditioning", "Free parking", "TV"],
    },
]


REVIEW_TEXTS = [
    "Beautiful property and exactly as described. Would happily stay again.",
    "Very comfortable stay with a great location. The host was responsive.",
    "Clean, peaceful and well maintained. The photos matched the property.",
    "Really enjoyed the stay. Great value and a lovely place.",
]


def get_or_create_amenity(db: Session, name: str):
    amenity = (
        db.query(Amenity)
        .filter(Amenity.name == name)
        .first()
    )

    if not amenity:
        amenity = Amenity(name=name)
        db.add(amenity)
        db.commit()
        db.refresh(amenity)

    return amenity


def get_or_create_reviewer(
    db: Session,
    user_id: int,
    name: str,
    email: str,
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        user = User(
            id=user_id,
            name=name,
            email=email,
            role="guest",
            avatar_url=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def seed():
    db = SessionLocal()

    try:
        # Additional guest users for realistic reviews.
        reviewers = [
            (4, "Riya Kapoor", "riya@example.com"),
            (5, "Arjun Verma", "arjun@example.com"),
            (6, "Neha Singh", "neha@example.com"),
        ]

        for user_id, name, email in reviewers:
            get_or_create_reviewer(
                db,
                user_id,
                name,
                email,
            )

        created = 0
        skipped = 0

        for item in LISTINGS:
            existing = (
                db.query(Listing)
                .filter(
                    Listing.title == item["title"]
                )
                .first()
            )

            if existing:
                skipped += 1
                continue

            listing = Listing(
                host_id=item["host_id"],
                title=item["title"],
                description=item["description"],
                location=item["location"],
                property_type=item["property_type"],
                price_per_night=item["price_per_night"],
                max_guests=item["max_guests"],
                bedrooms=item["bedrooms"],
                beds=item["beds"],
                bathrooms=item["bathrooms"],
                latitude=item["latitude"],
                longitude=item["longitude"],
            )

            db.add(listing)
            db.commit()
            db.refresh(listing)

            # Images
            for index, image_url in enumerate(
                item["images"]
            ):
                db.add(
                    ListingImage(
                        listing_id=listing.id,
                        image_url=image_url,
                        display_order=index,
                    )
                )

            # Amenities
            for amenity_name in item["amenities"]:
                amenity = get_or_create_amenity(
                    db,
                    amenity_name,
                )

                exists = (
                    db.query(ListingAmenity)
                    .filter(
                        ListingAmenity.listing_id
                        == listing.id,
                        ListingAmenity.amenity_id
                        == amenity.id,
                    )
                    .first()
                )

                if not exists:
                    db.add(
                        ListingAmenity(
                            listing_id=listing.id,
                            amenity_id=amenity.id,
                        )
                    )

            db.commit()

            # Seed realistic reviews directly.
            # These are demo records, so they do not need
            # to go through the normal review endpoint.
            ratings = [5, 5, 4]

            for index, reviewer_id in enumerate(
                [4, 5, 6]
            ):
                db.add(
                    Review(
                        listing_id=listing.id,
                        user_id=reviewer_id,
                        rating=ratings[index],
                        comment=REVIEW_TEXTS[
                            (listing.id + index)
                            % len(REVIEW_TEXTS)
                        ],
                    )
                )

            # Add a completed historical booking for
            # one reviewer so the seeded listing also
            # has realistic booking history.
            db.add(
                Booking(
                    listing_id=listing.id,
                    guest_id=4,
                    check_in=date(2026, 8, 10),
                    check_out=date(2026, 8, 13),
                    guests=2,
                    nights=3,
                    nightly_price=item["price_per_night"],
                    cleaning_fee=500,
                    service_fee=round(
                        item["price_per_night"]
                        * 3
                        * 0.12,
                        2,
                    ),
                    total_price=round(
                        item["price_per_night"]
                        * 3
                        + 500
                        + item["price_per_night"]
                        * 3
                        * 0.12,
                        2,
                    ),
                    status="confirmed",
                )
            )

            db.commit()

            created += 1

            print(
                f"Created listing: {listing.title}"
            )

        print()
        print(
            f"Done. Created {created} new listings."
        )
        print(
            f"Skipped {skipped} listings that already existed."
        )

    finally:
        db.close()


if __name__ == "__main__":
    seed()
