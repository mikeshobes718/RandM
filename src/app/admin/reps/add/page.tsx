"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminAddRep() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      whatsapp: formData.get('whatsapp'),
      start_date: formData.get('start_date'),
      payment_method: formData.get('payment_method'),
      payment_id: formData.get('payment_id'),
      status: formData.get('status'),
      notes: formData.get('notes'),
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create rep');
      }

      router.push("/admin/reps");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full h-14 px-6 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-brand/20 text-sm font-bold placeholder:text-slate-400 transition-all";

  return (
    <div className="max-w-3xl animate-fade-in">
      <Link 
        href="/admin/reps"
        className="flex items-center gap-1 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        Back to All Reps
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center sm:text-left">Add New Representative</h1>
        <p className="text-slate-500 font-medium mt-1 text-center sm:text-left">Onboard a new closer and generate their tracking links.</p>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
              <input name="name" type="text" placeholder="e.g. Sarah Jenkins" className={inputClass} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
              <input name="email" type="email" placeholder="sarah@example.com" className={inputClass} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp Number</label>
              <input name="whatsapp" type="text" placeholder="+1..." className={inputClass} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Start Date</label>
              <input name="start_date" type="date" className={inputClass} required defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Payment Method</label>
              <select name="payment_method" className={inputClass}>
                <option value="Wise">Wise</option>
                <option value="Payoneer">Payoneer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Payment Email / ID</label>
              <input name="payment_id" type="text" placeholder="Wise tag or Payoneer email" className={inputClass} required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Initial Status</label>
            <div className="flex gap-4">
              {['trial', 'active'].map(status => (
                <label key={status} className="flex-1 cursor-pointer">
                  <input type="radio" name="status" value={status} className="peer hidden" defaultChecked={status === 'trial'} />
                  <div className="h-14 flex items-center justify-center rounded-2xl bg-slate-50 peer-checked:bg-brand peer-checked:text-white border border-transparent peer-checked:shadow-lg transition-all font-bold text-sm uppercase">
                    {status}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Internal Notes</label>
            <textarea name="notes" placeholder="Any additional context about this rep..." className={inputClass + " h-32 py-4 resize-none"}></textarea>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-16 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Portal Access...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Create Rep Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
