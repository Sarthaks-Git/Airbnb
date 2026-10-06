from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base


class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    image_url = Column(String, nullable=False)
    display_order = Column(Integer, default=0)