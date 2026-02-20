import React from 'react';

interface SequencePreviewProps {
    businessName: string;
    headline?: string;
    subheading?: string;
}

export default function SequencePreview({ businessName, headline, subheading }: SequencePreviewProps) {
    return (
        <div className="space-y-12 animate-fade-in">
            {/* Intro text */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-sm text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                    Our smart routing engine works exactly the same whether a customer scans your physical QR code or clicks a link from an automated text message. Here's exactly what your customers see.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                
                {/* FLOW 1: In-Store QR Flow */}
                <div className="space-y-6 relative">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-8">
                        <span className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center text-xl shadow-lg shadow-brand/30">📱</span>
                        In-Store QR Flow
                    </h3>

                    {/* Step 1: Scan */}
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center relative z-10 shadow-md">1</div>
                            <div className="w-px h-24 bg-slate-200 border-l border-dashed border-slate-300"></div>
                        </div>
                        <div className="flex-1 premium-card p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Action</p>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-2xl">📷</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Scans QR Code</p>
                                    <p className="text-[11px] text-slate-500 font-medium mt-1">From a receipt, table tent, or checkout counter.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Landing Page */}
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center relative z-10 shadow-md">2</div>
                            <div className="w-px h-48 bg-slate-200 border-l border-dashed border-slate-300"></div>
                        </div>
                        <div className="flex-1 premium-card p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Step 1: The Landing Page</p>
                            
                            {/* Phone Mockup (Mini) */}
                            <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-2 max-w-[240px] mx-auto shadow-inner relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-200 rounded-b-xl z-20"></div>
                                <div className="bg-white rounded-[20px] h-full p-6 text-center border border-slate-100 shadow-sm relative overflow-hidden">
                                    <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight">{headline || "How was your experience?"}</h4>
                                    <p className="text-[10px] text-slate-500 mb-6 font-medium">{subheading || `Share your feedback with ${businessName}.`}</p>
                                    <div className="flex justify-center gap-1 mb-6">
                                        {[1,2,3,4,5].map(s => (
                                            <svg key={s} className="w-6 h-6 text-slate-200 hover:text-amber-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="w-24 h-1 bg-slate-200 rounded-full mx-auto mt-4"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Branching logic */}
                    <div className="flex items-start gap-4 relative">
                        <div className="flex flex-col items-center gap-2 mt-2 absolute left-0 z-20">
                            <div className="w-6 h-6 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-brand/30">3</div>
                        </div>
                        <div className="flex-1 ml-10 mt-2 grid gap-6">
                            
                            {/* Positive Branch */}
                            <div className="relative group">
                                <div className="absolute -left-6 top-1/2 w-6 h-px bg-slate-200 border-t border-dashed border-slate-300"></div>
                                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between hover:shadow-md transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">5</span>
                                            If 5 Stars
                                        </p>
                                        <p className="text-sm font-black text-slate-800">Redirected to Google Maps</p>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1">Directly to your public review page.</p>
                                    </div>
                                    <span className="text-3xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all z-10">🚀</span>
                                </div>
                            </div>
                            
                            {/* Negative Branch with Phone Mockup */}
                            <div className="relative group">
                                <div className="absolute -left-6 top-1/2 w-6 h-px bg-slate-200 border-t border-dashed border-slate-300"></div>
                                <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/20 rounded-bl-full pointer-events-none"></div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] shadow-sm">1-4</span>
                                        If 1-4 Stars (Private Feedback)
                                    </p>
                                    
                                    {/* Negative Feedback Phone Mockup */}
                                    <div className="bg-white border border-slate-200 rounded-[32px] p-2.5 max-w-[280px] mx-auto shadow-xl relative z-10 transform transition-transform group-hover:scale-[1.02] group-hover:shadow-2xl">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-200 rounded-b-xl z-20"></div>
                                        <div className="bg-[#fafafa] rounded-[24px] h-full p-6 flex flex-col gap-6 border border-slate-100/50 pt-10">
                                            <h4 className="text-[15px] font-black text-slate-900 leading-snug tracking-tight">
                                                We're sorry to hear about your experience. We want to make it right
                                            </h4>
                                            
                                            <div className="bg-slate-100/80 rounded-xl p-4 text-[11px] text-slate-400 font-medium border border-slate-200/60 shadow-inner min-h-[80px]">
                                                Please tell us what went wrong so our manager can contact you personally.
                                            </div>
                                            
                                            <div className="mt-auto space-y-4">
                                                <button className="w-full h-12 bg-[#2563eb] hover:bg-blue-700 text-white rounded-2xl text-[13px] font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                                    Send Private Feedback
                                                </button>
                                                
                                                <p className="text-[9px] text-center text-slate-400 font-medium leading-relaxed">
                                                    Still want to share your feedback on Google? <br/>
                                                    <span className="text-[#2563eb] underline cursor-pointer hover:text-blue-700">Click here.</span>
                                                </p>
                                            </div>
                                            <div className="w-24 h-1 bg-slate-200 rounded-full mx-auto mt-2"></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-slate-500 font-medium mt-6 italic">Feedback is sent directly to your Dashboard Inbox.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FLOW 2: Automated POS / Text Flow */}
                <div className="space-y-6 relative mt-16 xl:mt-0">
                    <div className="absolute -left-6 top-0 bottom-0 w-px bg-slate-200 border-l border-dashed border-slate-300 hidden xl:block"></div>
                    
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-8 xl:pl-6">
                        <span className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30">💬</span>
                        POS / Text Flow
                    </h3>

                    <div className="xl:pl-6 space-y-6">
                        {/* Step 1: Receive Text */}
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center relative z-10 shadow-md">1</div>
                                <div className="w-px h-24 bg-slate-200 border-l border-dashed border-slate-300"></div>
                            </div>
                            <div className="flex-1 premium-card p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Action</p>
                                
                                {/* SMS Bubble Mockup */}
                                <div className="bg-[#e8f5e9] border border-emerald-100/50 rounded-2xl rounded-tl-sm p-4 max-w-[260px] relative shadow-sm ml-2">
                                    <div className="absolute -left-2 top-0 w-4 h-4 bg-[#e8f5e9] border-t border-l border-emerald-100/50 -rotate-45 transform origin-top-left -z-10"></div>
                                    <p className="text-[13px] text-slate-800 relative z-10 font-medium leading-relaxed">
                                        Hi! Thanks for visiting <span className="font-bold">{businessName}</span>. We'd love to hear your feedback: <span className="text-blue-600 underline decoration-blue-300 underline-offset-2">rvws.io/xyz</span>
                                    </p>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-4 italic">Sent automatically via Square or Review Requests list.</p>
                            </div>
                        </div>

                        {/* Step 2: Landing Page */}
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center relative z-10 shadow-md">2</div>
                                <div className="w-px h-48 bg-slate-200 border-l border-dashed border-slate-300"></div>
                            </div>
                            <div className="flex-1 premium-card p-6 rounded-3xl bg-white border border-slate-100 shadow-sm opacity-60 hover:opacity-100 transition-opacity flex flex-col justify-center min-h-[220px]">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Step 1: The Landing Page</p>
                                <div className="text-center">
                                    <span className="text-4xl block mb-4">🔗</span>
                                    <h4 className="text-sm font-bold text-slate-800 mb-2">Customer Clicks Link</h4>
                                    <p className="text-xs text-slate-500 font-medium px-4">They are taken to the exact same Landing Page shown on the left.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Branching logic */}
                        <div className="flex items-start gap-4 relative">
                            <div className="flex flex-col items-center gap-2 mt-2 absolute left-0 z-20">
                                <div className="w-6 h-6 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-brand/30">3</div>
                            </div>
                            <div className="flex-1 ml-10 mt-2 grid gap-4">
                                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 border-dashed text-center opacity-60 hover:opacity-100 transition-opacity flex flex-col items-center justify-center h-full min-h-[160px]">
                                    <span className="text-3xl mb-3 block">🔄</span>
                                    <p className="text-sm font-bold text-slate-800 mb-1">Smart Routing Rules Apply</p>
                                    <p className="text-xs text-slate-500 font-medium mb-4">The experience is identical.</p>
                                    <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 5 Stars</span>
                                        <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100"><span className="w-2 h-2 rounded-full bg-slate-300"></span> 1-4 Stars</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}