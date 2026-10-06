from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Review, Listing, Booking

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/{listing_id}")
def get_reviews(
    listing_id: int,
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(Review.listing_id == listing_id)
        .all()
    )

    return reviews


@router.post("/")
def create_review(
    listing_id: int,
    user_id: int,
    rating: int,
    comment: str,
    db: Session = Depends(get_db),
):
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5",
        )

    listing = (
        db.query(Listing)
        .filter(Listing.id == listing_id)
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    booking = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            Booking.guest_id == user_id,
            Booking.status == "confirmed",
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=400,
            detail="You can only review a listing you have booked",
        )

    existing_review = (
        db.query(Review)
        .filter(
            Review.listing_id == listing_id,
            Review.user_id == user_id,
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this listing",
        )

    review = Review(
        listing_id=listing_id,
        user_id=user_id,
        rating=rating,
        comment=comment,
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return review