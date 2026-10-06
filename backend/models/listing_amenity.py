from sqlalchemy import Column, Integer, ForeignKey
from database import Base


class ListingAmenity(Base):
    __tablename__ = "listing_amenities"

    listing_id = Column(
        Integer,
        ForeignKey("listings.id"),
        primary_key=True
    )

    amenity_id = Column(
        Integer,
        ForeignKey("amenities.id"),
        primary_key=True
    )