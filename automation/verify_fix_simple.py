"""
Simplified verification of the fix for the Outreach Modal issue.
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

from browser_use import Agent, BrowserSession, BrowserProfile
from browser_use.llm.openai.chat import ChatOpenAI


def _build_llm() -> ChatOpenAI:
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if openrouter_key:
        return ChatOpenAI(
            model="google/gemini-3.1-pro-preview",
            api_key=openrouter_key,
            base_url="https://openrouter.ai/api/v1",
        )
    print("Missing OPENROUTER_API_KEY", file=sys.stderr)
    sys.exit(1)


async def main() -> None:
    llm = _build_llm()
    
    profile = BrowserProfile(
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        viewport={'width': 390, 'height': 844},
    )
    session = BrowserSession(browser_profile=profile, headless=True)
    
    email = "volurer295@ovbest.com"
    password = "T@st1234"

    task = (\
        "1. Login to https://reviewsandmarketing.com/login with '{email}' / '{password}'. "\
        "2. Go to https://reviewsandmarketing.com/contacts directly. "\
        "3. Select a contact and open the Email modal. "\
        "4. Click the textarea and scroll to the bottom. "\
        "5. Confirm if you can type and see the bottom button. "\
        "Keep it very fast."\
    ).format(email=email, password=password)

    agent = Agent(task=task, llm=llm, browser_session=session)
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
