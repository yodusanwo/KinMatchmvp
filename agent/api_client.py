"""
api_client.py — HTTP client for the KinMatch Relational Care Agent.

This module handles two responsibilities:
  1. Fetching a user-scoped JWT from the agent auth endpoint
  2. Making authenticated requests to KinMatch APIs using that JWT

The JWT is cached for the duration of an agent run, since each token lasts
~1 hour and an agent run completes in seconds.

Environment variables required (loaded from agent/.env):
  - KINMATCH_API_BASE_URL: e.g., "https://app.kinmatch.co"
  - KINMATCH_AGENT_SECRET: the shared secret for service-to-service auth
"""

import os
import time
from typing import Any, Optional

import requests
from dotenv import load_dotenv

# Load environment variables from agent/.env
load_dotenv()


class KinMatchAPIClient:
    """
    Client for making authenticated requests to KinMatch APIs on behalf of
    a specific user.

    Usage:
        client = KinMatchAPIClient(user_id="abc-123-...")
        profile = client.get("/api/agent/user/profile")
        client.post("/api/agent/decisions", json={"decision_type": "..."})
    """

    def __init__(self, user_id: str):
        self.user_id = user_id

        # Load config from env
        self.base_url = os.environ.get("KINMATCH_API_BASE_URL")
        self.agent_secret = os.environ.get("KINMATCH_AGENT_SECRET")

        if not self.base_url:
            raise ValueError("KINMATCH_API_BASE_URL not set in agent/.env")
        if not self.agent_secret:
            raise ValueError("KINMATCH_AGENT_SECRET environment variable is not set. In local dev, set it in agent/.env. In Cloud Run, configure it via Secret Manager.")

        # Strip trailing slash from base URL
        self.base_url = self.base_url.rstrip("/")

        # Token cache
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[float] = None

    def _fetch_token(self) -> str:
        """Fetch a fresh user-scoped JWT from the agent auth endpoint."""
        url = f"{self.base_url}/api/agent/auth/token"
        headers = {
            "Authorization": f"Bearer {self.agent_secret}",
            "X-Acting-As-User": self.user_id,
            "Content-Type": "application/json",
        }

        response = requests.post(url, headers=headers, timeout=10)

        if response.status_code != 200:
            raise RuntimeError(
                f"Failed to fetch agent token: HTTP {response.status_code} - {response.text}"
            )

        data = response.json()
        access_token = data.get("access_token")
        expires_in = data.get("expires_in", 3600)

        if not access_token:
            raise RuntimeError("Token response did not include access_token")

        self._access_token = access_token
        # Refresh 60 seconds before actual expiry to avoid edge cases
        self._token_expires_at = time.time() + expires_in - 60

        return access_token

    def _get_token(self) -> str:
        """Return a valid token, fetching a new one if needed."""
        if self._access_token is None or time.time() >= (self._token_expires_at or 0):
            return self._fetch_token()
        return self._access_token

    def _request(
        self,
        method: str,
        path: str,
        json: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """Make an authenticated request to a KinMatch API endpoint."""
        token = self._get_token()
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=json,
            params=params,
            timeout=15,
        )

        # Retry once if we hit 401 — token might have just expired
        if response.status_code == 401:
            self._access_token = None
            token = self._fetch_token()
            headers["Authorization"] = f"Bearer {token}"
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=json,
                params=params,
                timeout=15,
            )

        if response.status_code >= 400:
            raise RuntimeError(
                f"API request failed: {method} {path} -> "
                f"HTTP {response.status_code} - {response.text}"
            )

        # Return parsed JSON, or empty dict if no content
        if response.text:
            return response.json()
        return {}

    def get(self, path: str, params: Optional[dict] = None) -> dict:
        """Make a GET request to a KinMatch API endpoint."""
        return self._request("GET", path, params=params)

    def post(self, path: str, json: Optional[dict] = None) -> dict:
        """Make a POST request to a KinMatch API endpoint."""
        return self._request("POST", path, json=json)


def get_client(user_id: Optional[str] = None) -> KinMatchAPIClient:
    """
    Convenience factory. If user_id is not provided, uses TEST_USER_ID from env.
    """
    if user_id is None:
        user_id = os.environ.get("TEST_USER_ID")
        if not user_id:
            raise ValueError(
                "user_id not provided and TEST_USER_ID not set in agent/.env"
            )
    return KinMatchAPIClient(user_id=user_id)