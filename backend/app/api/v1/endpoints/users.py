import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.api.v1.deps import get_current_user

router = APIRouter()

# Ensure the upload directory exists
os.makedirs("static/profiles", exist_ok=True)

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "mobile_number": current_user.mobile_number,
        "profile_picture_url": current_user.profile_picture_url
    }

@router.put("/me")
async def update_profile(
    full_name: str = Form(None),
    email: str = Form(None),
    mobile_number: str = Form(None),
    profile_picture: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if full_name is not None:
        current_user.full_name = full_name
    if email is not None:
        current_user.email = email
    if mobile_number is not None:
        current_user.mobile_number = mobile_number

    if profile_picture and profile_picture.filename:
        # Generate a unique filename to prevent overwrites
        ext = profile_picture.filename.split('.')[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = f"static/profiles/{filename}"
        
        # Save the file locally
        with open(filepath, "wb") as f:
            f.write(await profile_picture.read())
            
        # Save the URL path in the database
        current_user.profile_picture_url = f"/static/profiles/{filename}"

    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully", 
        "profile_picture_url": current_user.profile_picture_url
    }