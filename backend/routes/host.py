from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Listing, ListingImage, Booking

router = APIRouter(prefix="/host", tags=["Host"])


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
    image_urls: list[str] = [],
    db: Session = Depends(get_db),
):
    listing = Listing(
        host_id=host_id,
        title=title,
        description=description,
        location=location,
        property_type=property_type,
        price_per_night=price_per_night,
        max_guests=max_guests,
        bedrooms=bedrooms,
        beds=beds,
        bathrooms=bathrooms,
    )

    db.add(listing)
    db.commit()
    db.refresh(listing)

    for index, image_url in enumerate(image_urls):
        image = ListingImage(
            listing_id=listing.id,
            image_url=image_url,
            display_order=index,
        )
        db.add(image)

    db.commit()

    return listing


@router.get("/listings")
def get_host_listings(
    host_id: int,
    db: Session = Depends(get_db),
):
    return db.query(Listing).filter(Listing.host_id == host_id).all()


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

    db.delete(listing)
    db.commit()

    return {"message": "Listing deleted successfully"}


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

    listing.title = title
    listing.description = description
    listing.location = location
    listing.property_type = property_type
    listing.price_per_night = price_per_night
    listing.max_guests = max_guests
    listing.bedrooms = bedrooms
    listing.beds = beds
    listing.bathrooms = bathrooms

    db.commit()
    db.refresh(listing)

    return listing


@router.get("/bookings")
def get_host_bookings(
    host_id: int,
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .filter(Listing.host_id == host_id)
        .all()
    )

    return bookings
