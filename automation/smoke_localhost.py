"""
Minimal browser-use smoke test against local Next dev server.

Prereqs:
  - `npm run dev` in repo root (http://localhost:3000)
  - LLM key (first match wins):
      * OPENROUTER_API_KEY → OpenRouter, default model google/gemini-3.1-pro-preview
      * OPENAI_API_KEY → OpenAI directly, default model gpt-4o
    Keys are loaded from Documents/Keys/.env, then .env.local / .env in the app folder.

Env overrides:
  - BROWSER_USE_BASE_URL (default http://localhost:3000)
  - BROWSER_USE_MODEL (OpenRouter model id or OpenAI model name)
  - OPENROUTER_BASE_URL (default https://openrouter.ai/api/v1)
  - OPENROUTER_HTTP_REFERER, OPENROUTER_APP_TITLE (optional OpenRouter ranking headers)

Run from repo root:
  reviewsandmarketing/automation/.venv/bin/python reviewsandmarketing/automation/smoke_localhost.py

Or from automation/:
  .venv/bin/python smoke_localhost.py
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
        title = os.environ.get("OPENROUTER_APP_TITLE", "reviewsandmarketing-local-dev")
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
    base = os.environ.get("BROWSER_USE_BASE_URL", "http://localhost:3000")

    task = (
        f"Go to {base}. Wait for the page to load. "
        "Report the main visible heading (h1) or site title. If you see a login or error state, say so. "
        "Do not enter credentials unless they are provided via automation env (none here). "
        "Keep the run short (under 15 steps)."
    )

    agent = Agent(task=task, llm=llm, max_actions_per_step=4, max_failures=3)
    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
