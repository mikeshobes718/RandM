"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminUploadLeads() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Basic CSV preview logic
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(0, 11); // Header + 10 rows
        const data = rows.map(row => row.split(','));
        setPreview(data);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    // Mock upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push("/admin/leads");
  };

  return (
    <div className="max-w-4xl animate-fade-in">
      <Link 
        href="/admin/leads"
        className="flex items-center gap-1 text-on-surface-variant/60 hover:text-on-surface-variant font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        Back to Lead Pool
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-on-surface tracking-tight">Upload New Leads</h1>
        <p className="text-on-surface-variant font-medium mt-1">Bulk import leads from a CSV file into the pool.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface p-8 rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface mb-6">1. Get the template</h3>
            <p className="text-sm text-on-surface-variant font-medium mb-6">Use our CSV template to ensure your leads are imported correctly.</p>
            <button className="w-full py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 text-xs font-black uppercase tracking-widest hover:bg-surface-container-low transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4 4m4-4V4" /></svg>
              Download CSV Template
            </button>
          </div>

          <div className="bg-brand/5 p-8 rounded-[40px] border border-brand/10">
            <h3 className="text-sm font-black uppercase tracking-widest text-brand mb-4">Pro Tip</h3>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Ensure all phone numbers are unique. Duplicates will be automatically flagged during import to keep your lead pool clean.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface p-10 rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface mb-8">2. Upload your file</h3>
            
            <form onSubmit={handleSubmit} className="space-y-10">
              <label className="group block cursor-pointer">
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <div className="border-4 border-dashed border-outline-variant/20 rounded-[32px] p-12 flex flex-col items-center justify-center group-hover:bg-surface-container-lowest group-hover:border-outline-variant/20 transition-all">
                  <div className="w-16 h-16 rounded-3xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant/50 mb-4 group-hover:scale-110 transition-all group-hover:bg-brand/10 group-hover:text-brand">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <p className="text-lg font-black text-on-surface">{file ? file.name : "Click to select CSV"}</p>
                  <p className="text-sm text-on-surface-variant/60 font-medium mt-1">or drag and drop your file here</p>
                </div>
              </label>

              {preview.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-2">Preview (First 10 rows)</h4>
                  <div className="overflow-hidden border border-outline-variant/20 rounded-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px] font-bold">
                        <thead className="bg-surface-container-lowest text-on-surface-variant/60 uppercase tracking-widest">
                          <tr>
                            {preview[0].map((h: string, i: number) => <th key={i} className="px-4 py-3 whitespace-nowrap">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                          {preview.slice(1).map((row: string[], i: number) => (
                            <tr key={i}>
                              {row.map((cell: string, j: number) => <td key={j} className="px-4 py-3 whitespace-nowrap">{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!file || submitting}
                className="w-full h-16 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    Importing Leads...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Confirm & Start Import
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
