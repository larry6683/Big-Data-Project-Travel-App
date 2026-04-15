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
from app.schemas.auth import Token, UserCreate, UserLogin, ForgotPassword, ResetPassword
from app.db.database import get_db
from app.db.models import User

router = APIRouter()

def send_reset_email(to_email: str, code: str):
    sender_email = settings.SMTP_USERNAME
    sender_password = settings.SMTP_PASSWORD
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = "WanderPlan US - Password Reset Code"
        
        body = f"Your password reset code is: {code}\n\nThis code will expire in 15 minutes."
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"Sent password reset email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        print(f"--- LOCAL DEV FALLBACK: RESET CODE FOR {to_email} IS [{code}] ---")

@router.post("/signup", response_model=Token)
async def sign_up(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    
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
    return {"access_token": access_token, "token_type": "bearer", "email": new_user.email, "status_code": 200}

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_credentials.email).first()
    if not db_user or not verify_password(user_credentials.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    access_token = create_access_token(
        data={"sub": db_user.email}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "email": db_user.email, "status_code": 200}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user:
        return {"message": "If that email is registered, a reset code has been sent.", "status_code": 200}
        
    code = ''.join(random.choices(string.digits, k=6))
    
    user.reset_code = code
    user.reset_code_expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    db.commit()
    
    send_reset_email(user.email, code)
    
    return {"message": "If that email is registered, a reset code has been sent.", "status_code": 200}


@router.post("/reset-password")
async def reset_password(req: ResetPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or user.reset_code != req.code:
        raise HTTPException(status_code=400, detail="Invalid email or verification code.")
        
    now = datetime.now(timezone.utc)
    now_naive = datetime.utcnow() 
    
    if not user.reset_code_expires or user.reset_code_expires < now_naive:
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
        
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()
    
    return {"message": "Password reset successfully. You can now log in.", "status_code": 200}