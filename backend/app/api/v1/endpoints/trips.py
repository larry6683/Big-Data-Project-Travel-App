# backend/app/api/v1/endpoints/trips.py
from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fpdf import FPDF
from datetime import datetime

from app.db.database import get_db
from app.db.models import User, SavedTrip
from app.api.v1.deps import get_current_user
from app.schemas.trip import TripGenerateRequest

import smtplib
from email.message import EmailMessage
from app.core.config import settings

router = APIRouter()

def sanitize_text(text) -> str:
    if text is None:
        return ""
    # Replace symbols that crash FPDF Helvetica
    clean_text = str(text).replace("°", " deg").replace("\u00b0", " deg").replace("\u2013", "-").replace("\u2014", "-")
    return clean_text.encode('latin-1', 'ignore').decode('latin-1')

def safe_float(value) -> float:
    """Safely converts a value to float without crashing."""
    if value is None:
        return 0.0
    try:
        if isinstance(value, dict):
            val = value.get('total') or value.get('amount') or 0
            return safe_float(val)
        
        clean_val = str(value).replace('$', '').replace(',', '').strip()
        if not clean_val or clean_val.upper() == "N/A":
            return 0.0
        return float(clean_val)
    except (ValueError, TypeError):
        return 0.0

def format_time(time_str: str) -> str:
    if not time_str: return ""
    try:
        dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        return dt.strftime("%I:%M %p")
    except: return time_str

def format_date(date_str: str) -> str:
    if not date_str: return ""
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime("%b %d")
    except: return date_str

def build_pdf_content(payload_dict: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    
    # --- HEADER ---
    pdf.set_font("helvetica", "B", 22)
    pdf.cell(0, 12, "Your Custom Itinerary", align="C", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, sanitize_text(payload_dict.get("destination", "Trip")), align="C", new_x="LMARGIN", new_y="NEXT")
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("helvetica", "I", 11)
    pdf.cell(0, 8, f"Prepared for: {sanitize_text(payload_dict.get('username'))} | {payload_dict.get('check_in_date')} - {payload_dict.get('check_out_date')}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # --- TOTAL COST (FLIGHT/DRIVE + HOTEL ONLY) ---
    total_cost = 0.0
    
    flight = payload_dict.get("flight")
    drive = payload_dict.get("drive")
    if flight:
        total_cost += safe_float(flight.get('price'))
    elif drive:
        total_cost += safe_float(drive.get('fuelEstimate'))
        
    hotel = payload_dict.get("hotel")
    if hotel:
        hotel_price = hotel.get('price') or hotel.get('offerDetails', {}).get('price')
        total_cost += safe_float(hotel_price)
    
    # NOTE: Activities and Tours cost are SKIPPED in this total calculation per request

    pdf.set_font("helvetica", "B", 13)
    pdf.set_text_color(34, 197, 94) # Green
    pdf.cell(0, 10, f"TOTAL ESTIMATED COST: ${total_cost:,.2f}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(5)

    def draw_section_header(title):
        pdf.set_font("helvetica", "B", 13)
        pdf.set_fill_color(245, 245, 245)
        pdf.cell(0, 10, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    # Weather
    weather = payload_dict.get("weather")
    if weather:
        draw_section_header("Expected Weather")
        pdf.set_font("helvetica", "", 11)
        summary = weather.get("overall_summary") or weather.get("error", "Weather info available.")
        pdf.multi_cell(0, 7, f"  {sanitize_text(summary)}")
        pdf.ln(4)

    # Transportation
    if flight or drive:
        draw_section_header("Transportation")
        if flight:
            airline = sanitize_text(flight.get('airline_name', 'Flight'))
            price = safe_float(flight.get('price'))
            pdf.set_font("helvetica", "B", 11)
            pdf.cell(0, 7, f"  {airline} (Total: ${price:,.2f})", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("helvetica", "", 10)
            for i, itin in enumerate(flight.get("itineraries", [])):
                bound = "Outbound" if i == 0 else "Return"
                pdf.set_font("helvetica", "I", 9)
                pdf.cell(0, 6, f"    --- {bound} ---", new_x="LMARGIN", new_y="NEXT")
                pdf.set_font("helvetica", "", 9) # slightly smaller font for long airport names
                for seg in itin.get("segments", []):
                    # --- UPDATED: Map the airport names and fallback to code ---
                    dep_name = sanitize_text(seg.get('departure_airport_name') or seg.get('departure_airport', ''))
                    arr_name = sanitize_text(seg.get('arrival_airport_name') or seg.get('arrival_airport', ''))
                    dep_code = seg.get('departure_airport', '')
                    arr_code = seg.get('arrival_airport', '')
                    dep_time = format_time(seg.get('departure_time'))
                    arr_time = format_time(seg.get('arrival_time'))
                    
                    pdf.cell(0, 6, f"    {dep_name} ({dep_code}) [{dep_time}] -> {arr_name} ({arr_code}) [{arr_time}]", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(3)
        if drive:
            pdf.set_font("helvetica", "B", 11)
            pdf.cell(0, 7, "  Road Trip Journey", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("helvetica", "", 10)
            pdf.cell(0, 6, f"    Duration: {drive.get('duration')} | Distance: {drive.get('distance')}", new_x="LMARGIN", new_y="NEXT")
            pdf.cell(0, 6, f"    Estimated Fuel Cost: ${safe_float(drive.get('fuelEstimate')):,.2f}", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(3)

    # Accommodation
    if hotel:
        draw_section_header("Accommodation")
        pdf.set_font("helvetica", "B", 11)
        pdf.cell(0, 7, f"  {sanitize_text(hotel.get('name'))}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("helvetica", "", 10)
        addr = ", ".join(hotel.get("address", {}).get("lines", []))
        if addr: pdf.cell(0, 6, f"    Address: {sanitize_text(addr)}", new_x="LMARGIN", new_y="NEXT")
        hp = hotel.get('price') or hotel.get('offerDetails', {}).get('price')
        pdf.cell(0, 6, f"    Total Price: ${safe_float(hp):,.2f}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

    # Planned Attractions (Separate Section)
    attractions = payload_dict.get("attractions", [])
    if attractions:
        draw_section_header("Planned Attractions")
        pdf.set_font("helvetica", "", 11)
        for attr in attractions:
            pdf.cell(0, 7, f"   - {sanitize_text(attr.get('name'))}", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(4)

    # Tours & Activities (Separate Section)
    activities = payload_dict.get("activities", [])
    if activities:
        draw_section_header("Tours & Activities")
        pdf.set_font("helvetica", "", 11)
        for act in activities:
            name = act.get('name') or act.get('title')
            # Only showing names here to keep it clean, as costs aren't added to total
            pdf.cell(0, 7, f"   - {sanitize_text(name)}", new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())

@router.post("/generate-pdf")
async def generate_trip_pdf(payload: TripGenerateRequest):
    try:
        pdf_bytes = build_pdf_content(payload.model_dump())
        safe_name = "".join(x for x in payload.destination if x.isalnum()) or "Itinerary"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_name}_Itinerary.pdf"'}
        )
    except Exception as e:
        print(f"PDF Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF Generation Failed: {str(e)}")

@router.post("/share-pdf")
async def share_trip_pdf(payload: TripGenerateRequest):
    if not payload.email:
        raise HTTPException(status_code=400, detail="Email is required")
    try:
        pdf_bytes = build_pdf_content(payload.model_dump())
        msg = EmailMessage()
        msg['Subject'] = f"Itinerary: {payload.destination}"
        msg['From'] = settings.FROM_EMAIL
        msg['To'] = payload.email
        msg.set_content(f"Hi {payload.username},\n\nAttached is your trip itinerary.\n\nSafe travels!")
        msg.add_attachment(pdf_bytes, maintype='application', subtype='pdf', filename="Itinerary.pdf")
        
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return {"message": "Email sent successfully"}
    except Exception as e:
        print(f"Email Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")

@router.post("/save")
async def save_trip(payload: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(SavedTrip).filter(SavedTrip.user_id == current_user.id).all()
    for trip in existing:
        if trip.data == payload: return {"message": "Trip already saved!"}
    new_trip = SavedTrip(destination=payload.get("destination", "My Trip"), data=payload, user_id=current_user.id)
    db.add(new_trip)
    db.commit()
    return {"message": "Trip saved successfully"}

@router.get("/me", response_model=List[dict])
async def get_my_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trips = db.query(SavedTrip).filter(SavedTrip.user_id == current_user.id).all()
    return [{"id": t.id, "destination": t.destination, "data": t.data} for t in trips]

@router.delete("/{trip_id}")
async def delete_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(SavedTrip).filter(SavedTrip.id == trip_id, SavedTrip.user_id == current_user.id).first()
    if not trip: raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}