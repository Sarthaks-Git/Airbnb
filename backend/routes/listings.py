from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from dependencies import get_db
from models import (
    Listing,
    ListingImage,
    Booking,
    Amenity,
    ListingAmenity,
    Review,
)

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

    # -----------------------------
    # Filters
    # -----------------------------

    if location:
        query = query.filter(
            Listing.location.ilike(f"%{location}%")
        )

    if property_type:
        query = query.filter(
            Listing.property_type == property_type
        )

    if min_price is not None:
        query = query.filter(
            Listing.price_per_night >= min_price
        )

    if max_price is not None:
        query = query.filter(
            Listing.price_per_night <= max_price
        )

    if guests is not None:
        query = query.filter(
            Listing.max_guests >= guests
        )

    # -----------------------------
    # Date validation
    # -----------------------------

    if check_in and check_out and check_out <= check_in:
        return {
            "items": [],
            "page": page,
            "limit": limit,
            "total": 0,
            "error": "Check-out must be after check-in",
        }

    # -----------------------------
    # Availability filtering
    # -----------------------------

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

    # -----------------------------
    # Pagination
    # -----------------------------

    total = query.count()

    listings = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []

    for listing in listings:

        # -----------------------------
        # Get all listing images
        # -----------------------------

        images = (
            db.query(ListingImage)
            .filter(
                ListingImage.listing_id == listing.id
            )
            .order_by(ListingImage.display_order)
            .all()
        )

        image_urls = [
            image.image_url
            for image in images
        ]

        # -----------------------------
        # Get reviews
        # -----------------------------

        reviews = (
            db.query(Review)
            .filter(
                Review.listing_id == listing.id
            )
            .all()
        )

        review_count = len(reviews)

        if review_count > 0:
            rating = round(
                sum(review.rating for review in reviews)
                / review_count,
                1,
            )
        else:
            rating = None

        # -----------------------------
        # Listing response
        # -----------------------------

        items.append({
            "id": listing.id,
            "title": listing.title,
            "location": listing.location,
            "price_per_night": listing.price_per_night,
            "property_type": listing.property_type,
            "max_guests": listing.max_guests,

            # Keep this for existing frontend compatibility
            "image_url": (
                image_urls[0]
                if image_urls
                else None
            ),

            # New real image collection
            "image_urls": image_urls,

            # Real review information
            "rating": rating,
            "review_count": review_count,
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
        return {
            "error": "Listing not found"
        }

    # -----------------------------
    # Images
    # -----------------------------

    images = (
        db.query(ListingImage)
        .filter(
            ListingImage.listing_id == listing_id
        )
        .order_by(ListingImage.display_order)
        .all()
    )

    # -----------------------------
    # Amenities
    # -----------------------------

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

    # -----------------------------
    # Reviews
    # -----------------------------

    reviews = (
        db.query(Review)
        .filter(
            Review.listing_id == listing_id
        )
        .all()
    )

    review_count = len(reviews)

    if review_count > 0:
        rating = round(
            sum(review.rating for review in reviews)
            / review_count,
            1,
        )
    else:
        rating = None

    return {
        "listing": listing,
        "images": images,
        "amenities": amenities,
        "rating": rating,
        "review_count": review_count,
    }