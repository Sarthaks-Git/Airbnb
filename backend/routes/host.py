from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import (
    Listing,
    ListingImage,
    ListingAmenity,
    Amenity,
    Booking,
    Review,
    Favorite,
)

router = APIRouter(prefix="/host", tags=["Host"])


# =========================================================
# CREATE LISTING
# =========================================================

@router.post("/listings")
def create_listing(
    host_id: int,
    title: str,
    description: str,
    location: str,
    property_type: str,
    price_per_night: float,
    max_guests: int,
    bedrooms: int,
    beds: int,
    bathrooms: int,
    image_urls: list[str] | None = None,
    amenities: list[str] | None = None,
    db: Session = Depends(get_db),
):
    if price_per_night <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than 0",
        )

    if max_guests < 1 or bedrooms < 1 or beds < 1 or bathrooms < 1:
        raise HTTPException(
            status_code=400,
            detail="Property values must be at least 1",
        )

    image_urls = image_urls or []
    amenities = amenities or []

    listing = Listing(
        host_id=host_id,
        title=title.strip(),
        description=description.strip(),
        location=location.strip(),
        property_type=property_type,
        price_per_night=price_per_night,
        max_guests=max_guests,
        bedrooms=bedrooms,
        beds=beds,
        bathrooms=bathrooms,
    )

    try:
        db.add(listing)
        db.flush()

        save_images(
            db,
            listing.id,
            image_urls,
        )

        save_amenities(
            db,
            listing.id,
            amenities,
        )

        db.commit()
        db.refresh(listing)

        return listing

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create listing",
        )


# =========================================================
# GET ALL HOST LISTINGS
# =========================================================

@router.get("/listings")
def get_host_listings(
    host_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(Listing)
        .filter(Listing.host_id == host_id)
        .order_by(Listing.id.desc())
        .all()
    )


# =========================================================
# GET SINGLE HOST LISTING
# =========================================================

@router.get("/listings/{listing_id}")
def get_host_listing(
    listing_id: int,
    host_id: int,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(
            Listing.id == listing_id,
            Listing.host_id == host_id,
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    images = (
        db.query(ListingImage)
        .filter(
            ListingImage.listing_id == listing_id
        )
        .order_by(ListingImage.display_order)
        .all()
    )

    amenities = (
        db.query(Amenity)
        .join(
            ListingAmenity,
            Amenity.id == ListingAmenity.amenity_id,
        )
        .filter(
            ListingAmenity.listing_id == listing_id
        )
        .order_by(Amenity.name)
        .all()
    )

    return {
        "listing": listing,
        "images": images,
        "amenities": amenities,
    }


# =========================================================
# DELETE LISTING
# =========================================================

@router.delete("/listings/{listing_id}")
def delete_listing(
    listing_id: int,
    host_id: int,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(
            Listing.id == listing_id,
            Listing.host_id == host_id,
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    try:
        # Delete bookings
        db.query(Booking).filter(
            Booking.listing_id == listing_id
        ).delete(
            synchronize_session=False
        )

        # Delete reviews
        db.query(Review).filter(
            Review.listing_id == listing_id
        ).delete(
            synchronize_session=False
        )

        # Delete favorites
        db.query(Favorite).filter(
            Favorite.listing_id == listing_id
        ).delete(
            synchronize_session=False
        )

        # Delete amenities relationships
        db.query(ListingAmenity).filter(
            ListingAmenity.listing_id == listing_id
        ).delete(
            synchronize_session=False
        )

        # Delete images
        db.query(ListingImage).filter(
            ListingImage.listing_id == listing_id
        ).delete(
            synchronize_session=False
        )

        # Finally delete listing
        db.delete(listing)

        db.commit()

        return {
            "message": (
                "Listing and all associated data "
                "deleted successfully"
            )
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete listing",
        )


# =========================================================
# UPDATE LISTING
# =========================================================

@router.put("/listings/{listing_id}")
def update_listing(
    listing_id: int,
    host_id: int,
    title: str,
    description: str,
    location: str,
    property_type: str,
    price_per_night: float,
    max_guests: int,
    bedrooms: int,
    beds: int,
    bathrooms: int,
    image_urls: list[str] | None = None,
    amenities: list[str] | None = None,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(
            Listing.id == listing_id,
            Listing.host_id == host_id,
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    if price_per_night <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than 0",
        )

    if (
        max_guests < 1
        or bedrooms < 1
        or beds < 1
        or bathrooms < 1
    ):
        raise HTTPException(
            status_code=400,
            detail="Property values must be at least 1",
        )

    try:
        # -----------------------------------------
        # Update basic listing information
        # -----------------------------------------

        listing.title = title.strip()
        listing.description = description.strip()
        listing.location = location.strip()
        listing.property_type = property_type
        listing.price_per_night = price_per_night
        listing.max_guests = max_guests
        listing.bedrooms = bedrooms
        listing.beds = beds
        listing.bathrooms = bathrooms

        db.flush()

        # -----------------------------------------
        # Update images ONLY if supplied
        # -----------------------------------------

        if image_urls is not None:
            db.query(ListingImage).filter(
                ListingImage.listing_id == listing_id
            ).delete(
                synchronize_session="fetch"
            )
            db.flush()

            save_images(
                db,
                listing_id,
                image_urls,
            )
            db.flush()

        # -----------------------------------------
        # Update amenities ONLY if supplied
        # -----------------------------------------

        if amenities is not None:
            db.query(ListingAmenity).filter(
                ListingAmenity.listing_id == listing_id
            ).delete(
                synchronize_session="fetch"
            )
            db.flush()

            save_amenities(
                db,
                listing_id,
                amenities,
            )
            db.flush()

        # -----------------------------------------
        # Commit everything together
        # -----------------------------------------

        db.commit()
        db.refresh(listing)

        return listing

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Unable to update listing: {str(exc)}",
        )


# =========================================================
# HOST BOOKINGS
# =========================================================

@router.get("/bookings")
def get_host_bookings(
    host_id: int,
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .join(
            Listing,
            Booking.listing_id == Listing.id,
        )
        .filter(
            Listing.host_id == host_id
        )
        .order_by(
            Booking.check_in.desc()
        )
        .all()
    )

    return bookings


# =========================================================
# SAVE IMAGES
# =========================================================

def save_images(
    db: Session,
    listing_id: int,
    image_urls: list[str],
):
    clean_urls = []

    for url in image_urls:
        stripped = url.strip() if url else ""
        # __clear__ is a sentinel sent by the frontend to explicitly clear images
        if stripped and stripped != "__clear__":
            clean_urls.append(stripped)

    for index, image_url in enumerate(clean_urls):
        db.add(
            ListingImage(
                listing_id=listing_id,
                image_url=image_url,
                display_order=index,
            )
        )


# =========================================================
# SAVE AMENITIES
# =========================================================

def save_amenities(
    db: Session,
    listing_id: int,
    amenity_names: list[str],
):
    clean_names = []
    seen = set()

    for name in amenity_names:
        if not name:
            continue

        clean_name = name.strip()

        # __clear__ is a sentinel sent by the frontend to explicitly clear amenities
        if not clean_name or clean_name == "__clear__":
            continue

        key = clean_name.lower()

        if key in seen:
            continue

        seen.add(key)
        clean_names.append(clean_name)

    for name in clean_names:
        amenity = (
            db.query(Amenity)
            .filter(
                Amenity.name.ilike(name)
            )
            .first()
        )

        if not amenity:
            amenity = Amenity(
                name=name
            )

            db.add(amenity)
            db.flush()

        existing_relation = (
            db.query(ListingAmenity)
            .filter(
                ListingAmenity.listing_id == listing_id,
                ListingAmenity.amenity_id == amenity.id,
            )
            .first()
        )

        if not existing_relation:
            db.add(
                ListingAmenity(
                    listing_id=listing_id,
                    amenity_id=amenity.id,
                )
            )