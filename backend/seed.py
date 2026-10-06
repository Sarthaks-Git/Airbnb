from database import Base, SessionLocal, engine
from models import User, Listing, ListingImage

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    host1 = User(
        name="Aarav Sharma",
        email="aarav@example.com",
        role="host",
    )

    host2 = User(
        name="Priya Mehta",
        email="priya@example.com",
        role="host",
    )

    guest = User(
        name="Sarthak",
        email="guest@example.com",
        role="guest",
    )

    db.add_all([host1, host2, guest])
    db.commit()

    db.refresh(host1)
    db.refresh(host2)

    listing1 = Listing(
        host_id=host1.id,
        title="Modern Apartment in Mumbai",
        description="A stylish apartment close to the city center.",
        location="Mumbai, Maharashtra",
        property_type="Apartment",
        price_per_night=4500,
        max_guests=4,
        bedrooms=2,
        beds=2,
        bathrooms=2,
        latitude=19.0760,
        longitude=72.8777,
    )

    listing2 = Listing(
        host_id=host2.id,
        title="Cozy Villa in Goa",
        description="A peaceful villa perfect for a relaxing getaway.",
        location="Goa, India",
        property_type="Villa",
        price_per_night=6500,
        max_guests=6,
        bedrooms=3,
        beds=4,
        bathrooms=3,
        latitude=15.2993,
        longitude=74.1240,
    )

    listing3 = Listing(
        host_id=host1.id,
        title="Lake View Stay in Udaipur",
        description="Beautiful stay with scenic lake views.",
        location="Udaipur, Rajasthan",
        property_type="House",
        price_per_night=3800,
        max_guests=3,
        bedrooms=1,
        beds=2,
        bathrooms=1,
        latitude=24.5854,
        longitude=73.7125,
    )

    db.add_all([listing1, listing2, listing3])
    db.commit()

    db.refresh(listing1)
    db.refresh(listing2)
    db.refresh(listing3)

    images = [
        ListingImage(
            listing_id=listing1.id,
            image_url="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
            display_order=1,
        ),
        ListingImage(
            listing_id=listing2.id,
            image_url="https://images.unsplash.com/photo-1582610116397-edb318620f8a",
            display_order=1,
        ),
        ListingImage(
            listing_id=listing3.id,
            image_url="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d",
            display_order=1,
        ),
    ]

    db.add_all(images)
    db.commit()

    print("Seed data inserted successfully.")

finally:
    db.close()