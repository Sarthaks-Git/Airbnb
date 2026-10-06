from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    property_type = Column(String, nullable=False)

    price_per_night = Column(Float, nullable=False)
    max_guests = Column(Integer, nullable=False)

    bedrooms = Column(Integer, nullable=False)
    beds = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)