"""
Vision-based reproduction of the issue reported by Blade.

Flow:
1. Log in to https://reviewsandmarketing.com
2. Navigate to /contacts
3. Select at least one contact.
4. Click "Email" to open the Outreach Modal.
5. Attempt to click the "Message Content" textarea.
6. Attempt to scroll the modal.
7. Report if the textarea is focused and if scrolling works.
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
    
    # Simulate a mobile-like viewport
    # BrowserProfile handles the context settings
    profile = BrowserProfile(
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        viewport={'width': 390, 'height': 844},
    )
    session = BrowserSession(browser_profile=profile, headless=True)
    
    email = "volurer295@ovbest.com"
    password = "T@st1234"

    task = (
        "1. Go to https://reviewsandmarketing.com/login. "
        f"2. Log in with email '{email}' and password '{password}'. "
        "3. Go to the Contacts page. "
        "4. If there are no contacts, add one manually first. "
        "5. Select a contact by clicking its checkbox. "
        "6. Click the 'Email' button to open the 'Send Email Outreach' modal. "
        "7. TRY TO CLICK the 'Message Content' textarea (the one that says 'Write your email message here...'). "
        "8. TRY TO SCROLL DOWN within the modal to see the 'Send Email Outreach' button at the bottom. "
        "9. VERIFY: Did the cursor appear in the textarea? Could you scroll to the bottom? "
        "Report any 'dead zones' or elements that seem to be blocking clicks or scrolls. "
        "Be extremely detailed about the visual state of the modal."
    )

    agent = Agent(task=task, llm=llm, browser_session=session)
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
