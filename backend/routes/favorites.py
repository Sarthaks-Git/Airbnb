from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Favorite, Listing, ListingImage

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("/")
def get_favorites(
    user_id: int,
    db: Session = Depends(get_db),
):
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id)
        .all()
    )

    items = []

    for favorite in favorites:
        listing = (
            db.query(Listing)
            .filter(Listing.id == favorite.listing_id)
            .first()
        )

        if not listing:
            continue

        image = (
            db.query(ListingImage)
            .filter(ListingImage.listing_id == listing.id)
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
            "image_url": image.image_url if image else None,
        })

    return items


@router.post("/{listing_id}")
def add_favorite(
    listing_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
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

    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == user_id,
            Favorite.listing_id == listing_id,
        )
        .first()
    )

    if existing:
        return {"message": "Already in favorites"}

    favorite = Favorite(
        user_id=user_id,
        listing_id=listing_id,
    )

    db.add(favorite)
    db.commit()

    return {
        "message": "Added to favorites",
        "listing_id": listing_id,
    }


@router.delete("/{listing_id}")
def remove_favorite(
    listing_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    favorite = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == user_id,
            Favorite.listing_id == listing_id,
        )
        .first()
    )

    if not favorite:
        return {"message": "Not in favorites"}

    db.delete(favorite)
    db.commit()

    return {
        "message": "Removed from favorites",
        "listing_id": listing_id,
    }