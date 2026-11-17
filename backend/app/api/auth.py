from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.all_models import User
from app.schemas.schemas import UserRegister, UserLogin, ForgotPasswordRequest, TokenResponse, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, response: Response, db: Session = Depends(get_db)):
    if user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    # Check duplicate email
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Hash password securely
    hashed_pwd = get_password_hash(user_in.password)

    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        age=user_in.age,
        password_hash=hashed_pwd,
        role="user",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue JWT token
    token = create_access_token(subject=new_user.id, role=new_user.role)

    # Set HttpOnly Cookie for security
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False  # Allow local HTTP development
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "age": new_user.age
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    # Support login with either email or admin username
    email_or_username = login_in.email.strip().lower()
    user = db.query(User).filter(
        (User.email == email_or_username) | 
        ((User.name == "admin") & (email_or_username == "admin")) |
        ((User.email == "admin@yatraai.local") & (email_or_username == "admin"))
    ).first()

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is currently inactive. Please contact an administrator."
        )

    token = create_access_token(subject=user.id, role=user.role)

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "age": user.age
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully."}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    # Always return a success message to prevent user enumeration attacks
    return {
        "message": f"If an account exists for {req.email}, password recovery instructions have been prepared."
    }

