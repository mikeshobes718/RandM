import React from 'react';

interface SequencePreviewProps {
    businessName: string;
    headline?: string;
    subheading?: string;
}

export default function SequencePreview({ businessName, headline, subheading }: SequencePreviewProps) {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Happy Path - 5 Stars */}
                <div className="premium-card p-8 rounded-[32px] bg-emerald-50/30 border border-emerald-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl">🌟</span>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">1</div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-700">The Happy Path</h3>
                            <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Customer selects 4-5 Stars</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step 1: Landing Page</p>
                            <h4 className="text-sm font-bold text-slate-800 mb-1">{headline || "How was your experience?"}</h4>
                            <p className="text-xs text-slate-500">{subheading || `Share your feedback with ${businessName}.`}</p>
                            <div className="mt-4 flex gap-2">
                                <div className="w-full h-8 rounded-lg bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center uppercase">😊 Great!</div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <div className="w-px h-8 bg-emerald-200 border-l border-dashed border-emerald-300"></div>
                        </div>

                        <div className="p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step 2: Instant Redirect</p>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <span className="text-2xl">🚀</span>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-700 uppercase">Automatic Boost</p>
                                    <p className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">Redirecting to Google Maps...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feedback Path - 1-3 Stars */}
                <div className="premium-card p-8 rounded-[32px] bg-rose-50/30 border border-rose-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl">🛡️</span>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black">2</div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-rose-700">The Feedback Path</h3>
                            <p className="text-[10px] font-bold text-rose-600/70 uppercase">Customer selects 1-3 Stars</p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="p-6 bg-white rounded-2xl border border-rose-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step 1: Landing Page</p>
                            <h4 className="text-sm font-bold text-slate-800 mb-1">{headline || "How was your experience?"}</h4>
                            <div className="mt-4 flex gap-2">
                                <div className="w-full h-8 rounded-lg bg-slate-400 text-white text-[10px] font-black flex items-center justify-center uppercase">😕 Could be better</div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <div className="w-px h-8 bg-rose-200 border-l border-dashed border-rose-300"></div>
                        </div>

                        <div className="p-6 bg-white rounded-2xl border border-rose-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step 2: Private Recovery</p>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-slate-50 rounded-md"></div>
                                <div className="h-20 w-full bg-slate-50 rounded-xl border border-slate-100 p-3 italic text-[10px] text-slate-400">
                                    Customer leaves private feedback here instead of Google...
                                </div>
                                <div className="w-full h-8 rounded-lg bg-rose-500 text-white text-[10px] font-black flex items-center justify-center uppercase">Save Reputation</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 font-medium">
                    💡 <strong>Pro Tip:</strong> This logic ensures happy customers build your public reputation while critical feedback stays private so you can fix it.
                </p>
            </div>
        </div>
    );
}
