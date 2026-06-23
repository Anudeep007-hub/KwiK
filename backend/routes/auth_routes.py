from fastapi import APIRouter, Query, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

# Local imports
from db_config import SessionLocal
from models.User import User
from models.requests import updateUserRequest
from services.auth import (
    JWTHandler,
    GitHubOAuth,
    GoogleOAuth,
    generate_user_id,
    generate_state,
)
from services.dependencies import get_current_user
import httpx

router = APIRouter(prefix="/v1/auth", tags=["auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/login/github")
async def login_github():
    """Generate GitHub OAuth authorization URL"""
    state = generate_state()
    url = GitHubOAuth.get_authorization_url(state)
    return {"url": url, "state": state}


@router.get("/login/google")
async def login_google():
    """Generate Google OAuth authorization URL"""
    state = generate_state()
    url = GoogleOAuth.get_authorization_url(state)
    return {"url": url, "state": state}


@router.post("/callback/github")
async def github_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    print("===== GITHUB CALLBACK =====")
    print("CODE:", code)
    print("STATE:", state)

    try:
        access_token = await GitHubOAuth.exchange_code_for_token(code)
        print("ACCESS TOKEN:", bool(access_token))

        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange authorization code"
            )

        user_info = await GitHubOAuth.get_user_info(access_token)
        print("USER INFO:", user_info)

        if not user_info:
            raise HTTPException(
                status_code=400,
                detail="Failed to fetch user information"
            )

        provider_user_id = str(user_info.get("id"))
        email = user_info.get("email") or f"github_{provider_user_id}@github.local"
        name = user_info.get("name") or user_info.get("login")

        print("EMAIL:", email)
        print("NAME:", name)
        print("PROVIDER ID:", provider_user_id)

        user = db.query(User).filter(
            User.email == email
        ).first()

        if user:
            print("EXISTING USER FOUND:", user.id)

            if not user.provider:
                user.provider = "github"

            if not user.providerUserId:
                user.providerUserId = provider_user_id

            db.commit()
            db.refresh(user)

        else:
            print("CREATING NEW USER")

            user = User(
                id=generate_user_id(),
                provider="github",
                providerUserId=provider_user_id,
                email=email,
                name=name,
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        jwt_token = JWTHandler.create_access_token(
            user.id,
            user.email
        )

        return {
            "token": jwt_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "provider": user.provider,
            },
        }

    except Exception as e:
        db.rollback()
        print("GITHUB CALLBACK ERROR:", repr(e))
        raise


@router.post("/callback/google")
async def google_callback(code: str = Query(...), state: str = Query(...), db: Session = Depends(get_db)):
    print("===== GOOGLE CALLBACK =====")
    print("CODE:", code)
    print("STATE:", state)

    try:
        access_token = await GitHubOAuth.exchange_code_for_token(code)
        print("ACCESS TOKEN:", bool(access_token))

        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange authorization code"
            )

        user_info = await GitHubOAuth.get_user_info(access_token)
        print("USER INFO:", user_info)

        if not user_info:
            raise HTTPException(
                status_code=400,
                detail="Failed to fetch user information"
            )

        provider_user_id = str(user_info.get("id"))
        email = user_info.get("email") or f"github_{provider_user_id}@google.local"
        name = user_info.get("name") or user_info.get("login")

        print("EMAIL:", email)
        print("NAME:", name)
        print("PROVIDER ID:", provider_user_id)

        user = db.query(User).filter(
            User.email == email
        ).first()

        if user:
            print("EXISTING USER FOUND:", user.id)

            if not user.provider:
                user.provider = "google"

            if not user.providerUserId:
                user.providerUserId = provider_user_id

            db.commit()
            db.refresh(user)

        else:
            print("CREATING NEW USER")

            user = User(
                id=generate_user_id(),
                provider="google",
                providerUserId=provider_user_id,
                email=email,
                name=name,
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        jwt_token = JWTHandler.create_access_token(
            user.id,
            user.email
        )

        return {
            "token": jwt_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "provider": user.provider,
            },
        }

    except Exception as e:
        db.rollback()
        print("GOOGLE CALLBACK ERROR:", repr(e))
        raise


@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Logout endpoint (mainly for frontend to clear local storage).
    JWT tokens are stateless, so no server-side action needed.
    """
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current authenticated user's information"""
    user_id = current_user.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "provider": user.provider,
        "createdAt": user.createdAt.isoformat(),
    }



@router.patch("/me")
async def update_user_profile(
    data: updateUserRequest.updateUserRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == current_user["sub"]
    ).first()

    user.name = data.name

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "provider": user.provider,
    }