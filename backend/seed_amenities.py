from database import SessionLocal
from models import Amenity, ListingAmenity


db = SessionLocal()

try:
    amenities = [
        "WiFi",
        "Kitchen",
        "Air conditioning",
        "Free parking",
        "Pool",
        "TV",
    ]

    amenity_objects = []

    for name in amenities:
        amenity = db.query(Amenity).filter(Amenity.name == name).first()

        if not amenity:
            amenity = Amenity(name=name)
            db.add(amenity)
            db.flush()

        amenity_objects.append(amenity)

    for listing_id in [1, 2, 3]:
        for amenity in amenity_objects:
            exists = (
                db.query(ListingAmenity)
                .filter(
                    ListingAmenity.listing_id == listing_id,
                    ListingAmenity.amenity_id == amenity.id,
                )
                .first()
            )

            if not exists:
                db.add(
                    ListingAmenity(
                        listing_id=listing_id,
                        amenity_id=amenity.id,
                    )
                )

    db.commit()

    print("Amenities inserted successfully.")

finally:
    db.close()