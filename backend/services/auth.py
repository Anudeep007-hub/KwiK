import jwt
import os
import httpx
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# OAuth Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

GITHUB_OAUTH_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# Redirect URIs
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/auth/callback/github")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback/google")


class JWTHandler:
    """Handle JWT token generation and validation"""
    
    @staticmethod
    def create_access_token(user_id: str, email: str) -> str:
        """Create a JWT access token"""
        payload = {
            "sub": user_id,
            "email": email,
            "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            "iat": datetime.utcnow(),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return token
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


class GitHubOAuth:
    """Handle GitHub OAuth 2.0 flow"""
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Generate GitHub OAuth authorization URL"""
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": GITHUB_REDIRECT_URI,
            "scope": "user:email",
            "state": state,
        }
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://github.com/login/oauth/authorize?{query_string}"
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> Optional[str]:
        """Exchange authorization code for access token"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GITHUB_OAUTH_URL,
                    data={
                        "client_id": GITHUB_CLIENT_ID,
                        "client_secret": GITHUB_CLIENT_SECRET,
                        "code": code,
                        "redirect_uri": GITHUB_REDIRECT_URI,
                    },
                    headers={"Accept": "application/json"},
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("access_token")
        except Exception as e:
            print(f"Error exchanging GitHub code: {e}")
        return None
    
    @staticmethod
    async def get_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user info from GitHub using access token"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    GITHUB_USER_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/json",
                    },
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Error fetching GitHub user info: {e}")
        return None


class GoogleOAuth:
    """Handle Google OAuth 2.0 flow"""
    
    @staticmethod
    def get_authorization_url(state: str) -> str:
        """Generate Google OAuth authorization URL"""
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
        }
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    @staticmethod
    async def exchange_code_for_token(code: str) -> Optional[Dict[str, str]]:
        """Exchange authorization code for access and ID tokens"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": GOOGLE_REDIRECT_URI,
                    },
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Error exchanging Google code: {e}")
        return None
    
    @staticmethod
    async def get_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user info from Google using access token"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    GOOGLE_USER_URL,
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"Error fetching Google user info: {e}")
        return None


def generate_user_id() -> str:
    """Generate a unique user ID"""
    return str(uuid.uuid4())


def generate_state() -> str:
    """Generate a random state parameter for OAuth"""
    return str(uuid.uuid4())