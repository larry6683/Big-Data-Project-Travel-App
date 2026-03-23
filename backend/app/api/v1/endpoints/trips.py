# backend/app/api/v1/endpoints/trips.py
from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fpdf import FPDF

from app.db.database import get_db
from app.db.models import User, SavedTrip
from app.api.v1.deps import get_current_user
from app.schemas.trip import TripGenerateRequest

import smtplib
from email.message import EmailMessage
from app.core.config import settings

router = APIRouter()

def sanitize_text(text: str) -> str:
    if not text:
        return ""
    return str(text).encode('latin-1', 'replace').decode('latin-1')

@router.post("/generate-pdf")
async def generate_trip_pdf(payload: TripGenerateRequest):
    pdf = FPDF()
    pdf.add_page()
    
    safe_destination = sanitize_text(payload.destination)
    safe_username = sanitize_text(payload.username)
    
    # Title
    pdf.set_font("helvetica", "B", 24)
    pdf.cell(0, 15, f"Trip Itinerary: {safe_destination}", ln=True, align="C")
    
    # Subheader
    pdf.set_font("helvetica", "I", 12)
    pdf.cell(0, 10, f"Prepared for: {safe_username}", ln=True, align="C")
    pdf.cell(0, 10, f"Dates: {payload.check_in_date} to {payload.check_out_date}", ln=True, align="C")
    pdf.ln(10)

    if payload.weather:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Weather Forecast", ln=True)
        pdf.set_font("helvetica", "", 12)
        
        if "error" in payload.weather:
            weather_text = sanitize_text(payload.weather["error"])
        else:
            weather_text = sanitize_text(payload.weather.get("overall_summary", "Weather data unavailable."))
            
        pdf.multi_cell(0, 8, weather_text)
        pdf.ln(5)

    # Flight Section
    if payload.flight:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Flight Details", ln=True)
        pdf.set_font("helvetica", "", 12)
        
        airline = sanitize_text(payload.flight.get('airline_name', 'Unknown Airline'))
        raw_price = payload.flight.get('price')
        if isinstance(raw_price, dict):
            price = raw_price.get('total', 'N/A')
        else:
            price = raw_price if raw_price is not None else 'N/A'
            
        pdf.multi_cell(0, 8, f"Airline: {airline}\nTotal Price: ${price}")
        pdf.ln(5)

    # Hotel Section
    if payload.hotel:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Hotel Details", ln=True)
        pdf.set_font("helvetica", "", 12)
        
        name = sanitize_text(payload.hotel.get('name', 'Unknown Hotel'))
        raw_hotel_price = payload.hotel.get('price') or payload.hotel.get('offerDetails', {}).get('price')
        price = raw_hotel_price if raw_hotel_price is not None else 'N/A'
        
        pdf.multi_cell(0, 8, f"Hotel: {name}\nPrice: ${price}")
        pdf.ln(5)

    # Attractions Section
    if payload.attractions:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Selected Attractions", ln=True)
        pdf.set_font("helvetica", "", 12)
        for attr in payload.attractions:
            name = sanitize_text(attr.get('name', 'Point of Interest'))
            pdf.cell(0, 8, f"- {name}", ln=True)
        pdf.ln(5)

    # Activities/Tours Section
    if payload.activities:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Activities & Tours", ln=True)
        pdf.set_font("helvetica", "", 12)
        for activity in payload.activities:
            name = sanitize_text(activity.get('name', 'Activity'))
            act_price_data = activity.get('price', {})
            if isinstance(act_price_data, dict):
                price = act_price_data.get('amount', 'N/A')
            else:
                price = act_price_data
                
            pdf.cell(0, 8, f"- {name} (${price})", ln=True)
        pdf.ln(5)

    safe_filename = "".join([c for c in safe_destination if c.isalpha() or c.isdigit()]).rstrip()
    if not safe_filename:
        safe_filename = "Itinerary"

    return Response(
        content=bytes(pdf.output()), 
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}_Itinerary.pdf"'}
    )

@router.post("/save")
async def save_trip(
    payload: dict, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    new_trip = SavedTrip(
        destination=payload.get("destination", "My Trip"),
        data=payload,
        user_id=current_user.id
    )
    db.add(new_trip)
    db.commit()
    return {"message": "Trip saved successfully"}

@router.get("/me", response_model=List[dict])
async def get_my_trips(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    trips = db.query(SavedTrip).filter(SavedTrip.user_id == current_user.id).all()
    return [{"id": t.id, "destination": t.destination, "data": t.data} for t in trips]

@router.delete("/{trip_id}")
async def delete_trip(
    trip_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    trip = db.query(SavedTrip).filter(
        SavedTrip.id == trip_id, 
        SavedTrip.user_id == current_user.id
    ).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}

@router.post("/share-pdf")
async def share_trip_pdf(payload: dict):
    target_email = payload.get("email")
    if not target_email:
        raise HTTPException(status_code=400, detail="Email is required")

    pdf = FPDF()
    pdf.add_page()
    
    safe_destination = sanitize_text(payload.get("destination", "Trip"))
    safe_username = sanitize_text(payload.get("username", "Traveler"))
    
    # Title & Subheader
    pdf.set_font("helvetica", "B", 24)
    pdf.cell(0, 15, f"Trip Itinerary: {safe_destination}", ln=True, align="C")
    
    pdf.set_font("helvetica", "I", 12)
    pdf.cell(0, 10, f"Prepared for: {safe_username}", ln=True, align="C")
    pdf.cell(0, 10, f"Dates: {payload.get('check_in_date')} to {payload.get('check_out_date')}", ln=True, align="C")
    pdf.ln(10)

    # Weather Section
    weather = payload.get("weather")
    if weather:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Weather Forecast", ln=True)
        pdf.set_font("helvetica", "", 12)
        
        if "error" in weather:
            weather_text = sanitize_text(weather["error"])
        else:
            weather_text = sanitize_text(weather.get("overall_summary", "Weather data unavailable."))
            
        pdf.multi_cell(0, 8, weather_text)
        pdf.ln(5)

    # Flight Section
    flight = payload.get("flight")
    if flight:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Flight Details", ln=True)
        pdf.set_font("helvetica", "", 12)
        
        airline = sanitize_text(flight.get('airline_name', 'Unknown Airline'))
        raw_price = flight.get('price')
        if isinstance(raw_price, dict):
            price = raw_price.get('total', 'N/A')
        else:
            price = raw_price if raw_price is not None else 'N/A'
            
        pdf.multi_cell(0, 8, f"Airline: {airline}\nTotal Price: ${price}")
        pdf.ln(5)

    # Hotel Section
    hotel = payload.get("hotel")
    if hotel:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Hotel Details", ln=True)
        pdf.set_font("helvetica", "", 12)
        
        name = sanitize_text(hotel.get('name', 'Unknown Hotel'))
        raw_hotel_price = hotel.get('price') or hotel.get('offerDetails', {}).get('price')
        price = raw_hotel_price if raw_hotel_price is not None else 'N/A'
        
        pdf.multi_cell(0, 8, f"Hotel: {name}\nPrice: ${price}")
        pdf.ln(5)

    # Attractions Section
    attractions = payload.get("attractions")
    if attractions:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Selected Attractions", ln=True)
        pdf.set_font("helvetica", "", 12)
        for attr in attractions:
            name = sanitize_text(attr.get('name', 'Point of Interest'))
            pdf.cell(0, 8, f"- {name}", ln=True)
        pdf.ln(5)

    # Activities/Tours Section
    activities = payload.get("activities")
    if activities:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Activities & Tours", ln=True)
        pdf.set_font("helvetica", "", 12)
        for activity in activities:
            name = sanitize_text(activity.get('name', 'Activity'))
            act_price_data = activity.get('price', {})
            if isinstance(act_price_data, dict):
                price = act_price_data.get('amount', 'N/A')
            else:
                price = act_price_data
                
            pdf.cell(0, 8, f"- {name} (${price})", ln=True)
        pdf.ln(5)

    # Generate Bytes
    pdf_bytes = bytes(pdf.output())
    safe_filename = "".join([c for c in safe_destination if c.isalpha() or c.isdigit()]).rstrip() or "Itinerary"

    # Send Email
    try:
        msg = EmailMessage()
        msg['Subject'] = f"Your Trip Itinerary to {safe_destination}"
        msg['From'] = settings.FROM_EMAIL
        msg['To'] = target_email
        msg.set_content(f"Hi {safe_username},\n\nAttached is your generated trip itinerary for {safe_destination}.\n\nSafe travels!")

        msg.add_attachment(pdf_bytes, maintype='application', subtype='pdf', filename=f"{safe_filename}_Itinerary.pdf")

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)

        return {"message": "Email sent successfully"}
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")