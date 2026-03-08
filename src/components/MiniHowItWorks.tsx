import { LucideIcon } from "lucide-react";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface Step {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface MiniHowItWorksProps {
  title?: string;
  steps: Step[];
  className?: string;
}

export function MiniHowItWorks({ title = "How it works", steps, className }: MiniHowItWorksProps) {
  return (
    <div className={cn("mt-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl", className)}>
      <div className="flex items-center gap-2 mb-6">
        <div className="px-2.5 py-1 rounded-md bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest">
          Guide
        </div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {/* Connecting line for desktop */}
        <div className="hidden md:block absolute top-5 left-[12.5%] right-[12.5%] h-[2px] bg-slate-200 -z-10" />
        
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex flex-col items-center text-center relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center mb-3 text-brand">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">{step.title}</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[140px]">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
