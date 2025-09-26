"use client";

import { useState } from "react";

type TabKey = "links" | "qr" | "automation" | "analytics";

const tabs: { key: TabKey; title: string; description: string }[] = [
  {
    key: "links",
    title: "Smart Links",
    description:
      "One-tap review links that open the Google review dialog instantly. Branded and trackable.",
  },
  {
    key: "qr",
    title: "QR Codes",
    description:
      "Beautiful, print-ready QR codes for table tents, receipts, and packaging.",
  },
  {
    key: "automation",
    title: "Email Automation",
    description:
      "Personalized requests and gentle follow-ups that boost response rates—set it and forget it.",
  },
  {
    key: "analytics",
    title: "Analytics",
    description:
      "See scans, clicks, and reviews over time with simple, actionable charts.",
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState<TabKey>("links");

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 md:gap-3">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
              aria-pressed={isActive}
            >
              {t.title}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 md:p-8">
        <p className="text-gray-600 mb-6">{tabs.find((t) => t.key === active)?.description}</p>
        {active === "links" && <DemoLinks />}
        {active === "qr" && <DemoQr />}
        {active === "automation" && <DemoAutomation />}
        {active === "analytics" && <DemoAnalytics />}
      </div>
    </div>
  );
}

function DemoLinks() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-xl border border-gray-100 p-4">
        <div className="text-sm text-gray-500 mb-2">Preview</div>
        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">Your Google Review Link</div>
            <div className="text-blue-100 text-sm">reviews.co/yourbrand</div>
          </div>
          <button className="bg-white text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50">
            Copy
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 p-4">
        <div className="text-sm text-gray-500 mb-2">Share</div>
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200">
            <svg aria-hidden className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 12h-6m0 0l3 3m-3-3l3-3M2 12h6m0 0l-3 3m3-3l-3-3"/></svg>
            SMS
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200">Email</span>
          <span className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 border border-gray-200">WhatsApp</span>
        </div>
      </div>
    </div>
  );
}

function DemoQr() {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="aspect-square rounded-xl bg-gray-50 border border-gray-200 grid place-content-center">
        <div className="w-40 h-40 bg-gradient-to-br from-gray-300 to-gray-200 rounded-md grid place-content-center text-gray-600">
          QR
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-2">Print-ready assets</h4>
        <p className="text-gray-600">Export high-resolution QR posters and table tents in one click. Add your logo and brand colors.</p>
        <div className="mt-4 flex gap-3">
          <span className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm">PNG</span>
          <span className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm">PDF</span>
          <span className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm">SVG</span>
        </div>
      </div>
    </div>
  );
}

function DemoAutomation() {
  const timeline = [
    { t: "Day 0", text: "Thank-you email with review link" },
    { t: "Day 3", text: "Friendly follow-up reminder" },
    { t: "Day 7", text: "Final check-in with alternate CTA" },
  ];
  return (
    <div>
      <ol className="relative border-s border-gray-200">
        {timeline.map((item, idx) => (
          <li key={idx} className="ms-6 mb-6">
            <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-600" />
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-gray-500 w-16">{item.t}</div>
              <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-sm">
                {item.text}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 text-gray-500 text-sm">Quiet hours and opt-outs are handled automatically.</div>
    </div>
  );
}

function DemoAnalytics() {
  return (
    <div className="grid md:grid-cols-5 gap-3 items-end h-40">
      {[18, 32, 24, 44, 36].map((h, i) => (
        <div key={i} className="rounded-md bg-gradient-to-t from-blue-600 to-purple-600" style={{ height: `${h * 2}px` }} />
      ))}
    </div>
  );
}

export default FeatureTabs;















