from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
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
    
    reset_code = Column(String, nullable=True)
    reset_code_expires = Column(DateTime, nullable=True)

    trips = relationship("SavedTrip", back_populates="owner")

class SavedTrip(Base):
    __tablename__ = "saved_trips"
    id = Column(Integer, primary_key=True, index=True)
    destination = Column(String, index=True)
    data = Column(JSON)  
    user_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="trips")
    
class SystemHealthStatus(Base):
    __tablename__ = "system_health_status"

    id = Column(Integer, primary_key=True, index=True)
    api_name = Column(String, unique=True, index=True, nullable=False)
    endpoint = Column(String, nullable=True)
    status_code = Column(Integer, nullable=True)
    status = Column(String, nullable=False) # UP or DOWN
    status_description = Column(String, nullable=True)
    last_checked = Column(DateTime(timezone=True), nullable=True)