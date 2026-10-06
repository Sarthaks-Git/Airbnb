from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Listing, ListingImage, Booking, Amenity, ListingAmenity

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.get("/")
def get_listings(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    location: str | None = None,
    property_type: str | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    guests: int | None = Query(None, ge=1),
    check_in: date | None = None,
    check_out: date | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Listing)

    # Location filter
    if location:
        query = query.filter(
            Listing.location.ilike(f"%{location}%")
        )

    # Property type filter
    if property_type:
        query = query.filter(
            Listing.property_type == property_type
        )

    # Price filters
    if min_price is not None:
        query = query.filter(
            Listing.price_per_night >= min_price
        )

    if max_price is not None:
        query = query.filter(
            Listing.price_per_night <= max_price
        )

    # Guest filter
    if guests is not None:
        query = query.filter(
            Listing.max_guests >= guests
        )

    # Date validation
    if check_in and check_out and check_out <= check_in:
        return {
            "items": [],
            "page": page,
            "limit": limit,
            "total": 0,
            "error": "Check-out must be after check-in",
        }

    # Availability filter
    if check_in and check_out:
        unavailable_listing_ids = (
            db.query(Booking.listing_id)
            .filter(
                Booking.check_in < check_out,
                Booking.check_out > check_in,
                Booking.status == "confirmed",
            )
            .subquery()
        )

        query = query.filter(
            ~Listing.id.in_(unavailable_listing_ids)
        )

    total = query.count()

    listings = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []

    for listing in listings:
        image = (
            db.query(ListingImage)
            .filter(
                ListingImage.listing_id == listing.id
            )
            .order_by(ListingImage.display_order)
            .first()
        )

        items.append({
            "id": listing.id,
            "title": listing.title,
            "location": listing.location,
            "price_per_night": listing.price_per_night,
            "property_type": listing.property_type,
            "max_guests": listing.max_guests,
            "image_url": (
                image.image_url
                if image
                else None
            ),
        })

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
    }


@router.get("/{listing_id}")
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .filter(Listing.id == listing_id)
        .first()
    )

    if not listing:
        return {"error": "Listing not found"}

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
            Amenity.id == ListingAmenity.amenity_id
        )
        .filter(
            ListingAmenity.listing_id == listing_id
        )
        .all()
    )

    return {
        "listing": listing,
        "images": images,
        "amenities": amenities,
    }