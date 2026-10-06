from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Booking, Listing

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("/availability")
def check_availability(
    listing_id: int,
    check_in: date,
    check_out: date,
    db: Session = Depends(get_db),
):
    overlapping = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            Booking.check_in < check_out,
            Booking.check_out > check_in,
            Booking.status == "confirmed",
        )
        .first()
    )

    return {"available": overlapping is None}


@router.post("/")
def create_booking(
    listing_id: int,
    guest_id: int,
    check_in: date,
    check_out: date,
    guests: int,
    db: Session = Depends(get_db),
):
    if check_out <= check_in:
        raise HTTPException(
            status_code=400,
            detail="Check-out must be after check-in",
        )

    listing = db.query(Listing).filter(Listing.id == listing_id).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if guests > listing.max_guests:
        raise HTTPException(
            status_code=400,
            detail="Too many guests for this listing",
        )

    overlapping = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            Booking.check_in < check_out,
            Booking.check_out > check_in,
            Booking.status == "confirmed",
        )
        .first()
    )

    if overlapping:
        raise HTTPException(
            status_code=400,
            detail="Listing is not available for these dates",
        )

    nights = (check_out - check_in).days
    nightly_price = listing.price_per_night
    cleaning_fee = 500
    service_fee = nightly_price * nights * 0.12
    total_price = nightly_price * nights + cleaning_fee + service_fee

    booking = Booking(
        listing_id=listing_id,
        guest_id=guest_id,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        nights=nights,
        nightly_price=nightly_price,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total_price=total_price,
        status="confirmed",
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


@router.get("/my-trips")
def get_my_trips(
    guest_id: int,
    db: Session = Depends(get_db),
):
    bookings = (
        db.query(Booking)
        .filter(Booking.guest_id == guest_id)
        .order_by(Booking.check_in.desc())
        .all()
    )

    return bookings
