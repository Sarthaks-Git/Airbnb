from fastapi import FastAPI

from database import Base, engine
from models import (
    User,
    Listing,
    ListingImage,
    Amenity,
    ListingAmenity,
    Booking,
    Review,
    Favorite,
)

Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Airbnb API is running"}