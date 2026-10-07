import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

from routes.listings import router as listings_router
from routes.bookings import router as bookings_router
from routes.host import router as host_router
from routes.favorites import router as favorites_router
from routes.reviews import router as reviews_router

Base.metadata.create_all(bind=engine)


app = FastAPI()


frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(listings_router)
app.include_router(bookings_router)
app.include_router(host_router)
app.include_router(favorites_router)
app.include_router(reviews_router)


@app.get("/")
def root():
    return {"message": "Airbnb API is running"}
