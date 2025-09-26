import { NextResponse } from "next/server";

const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY. Set it in your environment before using transcription." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append("model", "gpt-4o-mini-transcribe");
    upstreamFormData.append("file", file, file.name || "audio.webm");

    const upstreamResponse = await fetch(OPENAI_TRANSCRIBE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: upstreamFormData,
    });

    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      const message = data?.error?.message ?? "Failed to transcribe audio.";
      return NextResponse.json({ error: message }, { status: upstreamResponse.status });
    }

    return NextResponse.json({ text: data?.text ?? "" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while processing transcription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
