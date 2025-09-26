"use client";

import { useCallback, useRef, useState } from "react";

const MAX_RECORDING_SECONDS = 180;

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

export default function ListenPage() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetRecordingState = useCallback(() => {
    mediaRecorderRef.current = null;
    stopStream(mediaStreamRef.current);
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleRecorderStop = useCallback(async () => {
    const chunks = audioChunksRef.current;
    if (!chunks.length) {
      setIsProcessing(false);
      return;
    }

    const audioBlob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => undefined);
        const message = data?.error ?? "Transcription failed. Please try again.";
        throw new Error(message);
      }

      const result = await response.json();
      setTranscript(result.text ?? "");
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      resetRecordingState();
      setIsProcessing(false);
    }
  }, [resetRecordingState]);

  const cancelRecording = useCallback(() => {
    audioChunksRef.current = [];
    stopRecording();
    setIsProcessing(false);
    setTranscript("");
    setError(null);
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support audio capture.");
      return;
    }

    setTranscript("");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener("stop", () => {
        handleRecorderStop();
        resetRecordingState();
      });

      mediaRecorder.start();
      setIsRecording(true);
      setIsProcessing(true);

      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_SECONDS * 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to access microphone.";
      setError(message);
      resetRecordingState();
      setIsProcessing(false);
    }
  }, [handleRecorderStop, resetRecordingState, stopRecording]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">Live Transcription</h1>
        <p className="text-zinc-600">
          Press listen to capture audio from your microphone and send it to OpenAI for transcription.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={isProcessing && !isRecording}
          >
            {isRecording ? "Stop" : "Listen"}
          </button>
          <button
            type="button"
            onClick={cancelRecording}
            className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-800"
            disabled={isProcessing && !isRecording && !transcript}
          >
            Reset
          </button>
          {(isProcessing || isRecording) && (
            <span className="text-sm text-zinc-500">
              {isRecording ? "Recording…" : "Processing transcription…"}
            </span>
          )}
        </div>
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex min-h-[12rem] flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Transcript</span>
          <p className="whitespace-pre-wrap text-base text-zinc-800">
            {transcript || (isProcessing ? "Waiting for transcription…" : "Your transcript will appear here.")}
          </p>
        </div>
      </section>
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-800">
        <p>
          Keep your OpenAI API key secure by storing it in an environment variable such as <code>OPENAI_API_KEY</code>.
          Do not embed secrets directly in client-side code.
        </p>
      </section>
    </main>
  );
}
