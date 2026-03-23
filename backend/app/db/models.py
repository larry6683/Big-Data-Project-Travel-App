# backend/app/db/models.py
from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime # Add DateTime here
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String)
    
    full_name = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    
    # --- ADD THESE NEW FIELDS ---
    reset_code = Column(String, nullable=True)
    reset_code_expires = Column(DateTime, nullable=True)
    # ----------------------------

    trips = relationship("SavedTrip", back_populates="owner")

class SavedTrip(Base):
    __tablename__ = "saved_trips"
    id = Column(Integer, primary_key=True, index=True)
    destination = Column(String, index=True)
    data = Column(JSON)  # Stores the full itinerary object
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="trips")