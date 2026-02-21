import httpx
import time
from app.core.config import settings

class BaseAmadeusClient:
    def __init__(self):
        self.base_url = "https://test.api.amadeus.com"
        self.client_id = settings.AMADEUS_CLIENT_ID
        self.client_secret = settings.AMADEUS_CLIENT_SECRET
        self.token = None
        self.token_expiry = 0

    async def get_token(self):
        """Fetches and caches the OAuth2 token for Amadeus"""
        if self.token and time.time() < self.token_expiry:
            return self.token

        url = f"{self.base_url}/v1/security/oauth2/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, data=data)
            if response.status_code != 200:
                print(f"Auth Failed: {response.text}")
                return None
            result = response.json()
            self.token = result["access_token"]
            self.token_expiry = time.time() + result["expires_in"] - 10
            return self.token