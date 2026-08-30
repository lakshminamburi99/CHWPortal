"""
GCP Secret Manager Service:
Dynamically fetches production secrets from GCP Secret Manager API with local environment variable fallbacks.
"""
import os
import urllib.request
import json
from typing import Optional


class GCPSecretManagerService:
    @classmethod
    def get_secret(cls, secret_id: str, default_value: Optional[str] = None) -> Optional[str]:
        """
        Fetches secret payload from GCP Secret Manager API or environment variable fallback.
        """
        # First check local environment variables
        env_val = os.environ.get(secret_id) or os.environ.get(secret_id.upper())
        if env_val:
            return env_val

        project_id = os.environ.get("GCP_PROJECT_ID")
        if not project_id:
            return default_value

        # Attempt GCP Secret Manager REST API call
        try:
            url = f"https://secretmanager.googleapis.com/v1/projects/{project_id}/secrets/{secret_id}/versions/latest:access"
            req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    res = json.loads(response.read().decode("utf-8"))
                    payload_base64 = res.get("payload", {}).get("data", "")
                    import base64
                    return base64.b64decode(payload_base64).decode("utf-8")
        except Exception:
            pass

        return default_value
