"""
Vision-based login and navigation test for Reviews & Marketing.

Flow:
1. Navigate to production domain.
2. Log in with provided credentials.
3. Navigate to the Contacts page in the dashboard.
4. Verify the page loaded (report heading/summary).
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
_DOCS = _ROOT.parent
for p in (_DOCS / "Keys" / ".env", _ROOT / ".env.local", _ROOT / ".env"):
    if p.is_file():
        load_dotenv(p)
load_dotenv()

from browser_use import Agent
from browser_use.llm.openai.chat import ChatOpenAI


def _build_llm() -> ChatOpenAI:
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()

    if openrouter_key:
        model = os.environ.get("BROWSER_USE_MODEL", "google/gemini-3.1-pro-preview")
        base_url = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
        if "openrouter.ai" in base_url and not base_url.rstrip("/").endswith("/v1"):
            base_url = base_url.rstrip("/") + "/api/v1"
        referer = os.environ.get("OPENROUTER_HTTP_REFERER", "https://reviewsandmarketing.com")
        title = os.environ.get("OPENROUTER_APP_TITLE", "reviewsandmarketing-login-test")
        return ChatOpenAI(
            model=model,
            api_key=openrouter_key,
            base_url=base_url,
            default_headers={
                "HTTP-Referer": referer,
                "X-Title": title,
            },
        )

    if openai_key:
        model = os.environ.get("BROWSER_USE_MODEL", "gpt-4o")
        return ChatOpenAI(model=model, api_key=openai_key)

    print(
        "Missing OPENROUTER_API_KEY or OPENAI_API_KEY. Add one to Documents/Keys/.env or the environment.",
        file=sys.stderr,
    )
    sys.exit(1)


async def main() -> None:
    llm = _build_llm()
    base = "https://reviewsandmarketing.com"
    
    # Credentials from user query
    email = "volurer295@ovbest.com"
    password = "T@st1234"

    task = (
        f"Go to {base}. Find the login button and click it (or go directly to {base}/login). "
        f"Log in using the email '{email}' and password '{password}'. "
        "After logging in, wait for the dashboard to load. "
        "Then, find and click on the 'Contacts' link in the navigation menu. "
        "Once on the Contacts page, report the main heading and a brief summary of what you see (e.g., 'I see a list of contacts' or 'The contact list is empty'). "
        "If you encounter any issues like the login failing or the navigation being blocked, report that specifically. "
        "Keep the run efficient (under 20 steps)."
    )

    agent = Agent(task=task, llm=llm, max_actions_per_step=4, max_failures=3)
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
