# backend/app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

from app.core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
# Update schema imports to include the new schemas
from app.schemas.auth import Token, UserCreate, UserLogin, ForgotPassword, ResetPassword
from app.db.database import get_db
from app.db.models import User

router = APIRouter()

# --- EMAIL HELPER FUNCTION ---
def send_reset_email(to_email: str, code: str):
    # TODO: Replace with your actual email details (e.g., Gmail App Password)
    sender_email = settings.SMTP_USERNAME
    sender_password = settings.SMTP_PASSWORD
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = "WanderPlan US - Password Reset Code"
        
        body = f"Your password reset code is: {code}\n\nThis code will expire in 15 minutes."
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to Gmail SMTP server
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"Sent password reset email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        # FALLBACK FOR LOCAL TESTING: Prints the code to your backend terminal if email fails
        print(f"--- LOCAL DEV FALLBACK: RESET CODE FOR {to_email} IS [{code}] ---")

@router.post("/signup", response_model=Token)
async def sign_up(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    
    # Assuming you update models.py to use email as the main identifier
    new_user = User(
        email=user_in.email, 
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(
        data={"sub": new_user.email}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "email": new_user.email}

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_credentials.email).first()
    if not db_user or not verify_password(user_credentials.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(
        data={"sub": db_user.email}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "email": db_user.email}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user:
        # We return a generic success message even if email doesn't exist to prevent email enumeration attacks
        return {"message": "If that email is registered, a reset code has been sent."}
        
    # Generate 6-digit numeric code
    code = ''.join(random.choices(string.digits, k=6))
    
    # Save code to user model, valid for 15 minutes
    user.reset_code = code
    user.reset_code_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    db.commit()
    
    # Send email containing the code
    send_reset_email(user.email, code)
    
    return {"message": "If that email is registered, a reset code has been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or user.reset_code != req.code:
        raise HTTPException(status_code=400, detail="Invalid email or verification code.")
        
    # Ensure datetime comparison works properly with timezones
    now = datetime.now(timezone.utc)
    # If the database saves dates without timezone, we make 'now' naive for comparison
    now_naive = datetime.utcnow() 
    
    if not user.reset_code_expires or user.reset_code_expires < now_naive:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
        
    # Code is valid! Update the password and clear the reset code
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()
    
    return {"message": "Password reset successfully. You can now log in."}