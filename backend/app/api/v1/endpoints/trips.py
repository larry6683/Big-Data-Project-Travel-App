from fastapi import APIRouter, Response
from app.schemas.trip import TripGenerateRequest
from fpdf import FPDF 
router = APIRouter()

@router.post("/generate-pdf")
async def generate_trip_pdf(payload: TripGenerateRequest):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 24)
    
    pdf.cell(0, 15, f"Trip Itinerary: {payload.destination}", ln=True, align="C")
    pdf.set_font("helvetica", "I", 12)
    pdf.cell(0, 10, f"Prepared for: {payload.username}", ln=True, align="C")
    pdf.cell(0, 10, f"Dates: {payload.check_in_date} to {payload.check_out_date}", ln=True, align="C")
    pdf.ln(10)

    if payload.flight:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Flight Details", ln=True)
        pdf.set_font("helvetica", "", 12)
        pdf.multi_cell(0, 8, f"Price: {payload.flight.get('price', {}).get('total', 'N/A')}")
        pdf.ln(5)

    if payload.hotel:
        pdf.set_font("helvetica", "B", 16)
        pdf.cell(0, 10, "Hotel Details", ln=True)
        pdf.set_font("helvetica", "", 12)
        pdf.multi_cell(0, 8, f"Name: {payload.hotel.get('name')}\nPrice: ${payload.hotel.get('price')}")

    return Response(
        content=bytes(pdf.output()), 
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{payload.destination}_Itinerary.pdf"'}
    )