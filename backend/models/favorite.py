from sqlalchemy import Column, Integer, ForeignKey
from database import Base


class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        primary_key=True
    )

    listing_id = Column(
        Integer,
        ForeignKey("listings.id"),
        primary_key=True
    )