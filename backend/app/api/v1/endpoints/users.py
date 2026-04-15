import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from google.cloud import storage 

from app.db.database import get_db
from app.db.models import User
from app.api.v1.deps import get_current_user
from app.core.config import settings

router = APIRouter()

def upload_to_gcs(file: UploadFile, bucket_name: str, destination_blob_name: str):
    """Uploads a file to the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_file(file.file, content_type=file.content_type)
    
    return f"https://storage.googleapis.com/{bucket_name}/{destination_blob_name}"

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.email, 
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
    if full_name is None and email is None and mobile_number is None and (profile_picture is None or not profile_picture.filename):
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if full_name is not None:
        current_user.full_name = full_name
    if email is not None:
        current_user.email = email
    if mobile_number is not None:
        current_user.mobile_number = mobile_number

    if profile_picture and profile_picture.filename:
        ext = profile_picture.filename.split('.')[-1]
        filename = f"profiles/{uuid.uuid4()}.{ext}"
        
        try:
            public_url = upload_to_gcs(
                profile_picture, 
                settings.GCS_BUCKET_NAME, 
                filename
            )
            current_user.profile_picture_url = public_url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to cloud storage: {str(e)}")

    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully", 
        "profile_picture_url": current_user.profile_picture_url
    }