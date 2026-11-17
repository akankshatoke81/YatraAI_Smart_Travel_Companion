from fastapi import Depends, HTTPException, status, Header, Cookie
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.all_models import User

def get_token_from_header_or_cookie(
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    if access_token:
        return access_token
    return None

def get_current_user(
    token: Optional[str] = Depends(get_token_from_header_or_cookie),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact an administrator."
        )
    return user

def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Administrative privileges required."
        )
    return current_user

def get_optional_current_user(
    token: Optional[str] = Depends(get_token_from_header_or_cookie),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id), User.is_active == True).first()

