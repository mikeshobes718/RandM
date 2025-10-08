'use client';

import { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const analysis = useMemo(() => {
    const requirements: PasswordRequirement[] = [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /[0-9]/.test(password) },
      { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
    ];

    const metCount = requirements.filter(r => r.met).length;
    
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    let strengthLabel = 'Weak';
    let strengthColor = 'bg-red-500';
    let progressWidth = '0%';

    if (password.length === 0) {
      strengthLabel = '';
      strengthColor = 'bg-gray-300';
      progressWidth = '0%';
    } else if (metCount <= 2) {
      strength = 'weak';
      strengthLabel = 'Weak';
      strengthColor = 'bg-red-500';
      progressWidth = '25%';
    } else if (metCount === 3) {
      strength = 'fair';
      strengthLabel = 'Fair';
      strengthColor = 'bg-orange-500';
      progressWidth = '50%';
    } else if (metCount === 4) {
      strength = 'good';
      strengthLabel = 'Good';
      strengthColor = 'bg-yellow-500';
      progressWidth = '75%';
    } else {
      strength = 'strong';
      strengthLabel = 'Strong';
      strengthColor = 'bg-green-500';
      progressWidth = '100%';
    }

    return { requirements, strength, strengthLabel, strengthColor, progressWidth, metCount };
  }, [password]);

  // Always render the component so users see requirements before typing

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 font-medium">Password strength</span>
          {analysis.strengthLabel && (
            <span
              className={`font-semibold ${
                analysis.strength === 'weak'
                  ? 'text-red-600'
                  : analysis.strength === 'fair'
                  ? 'text-orange-600'
                  : analysis.strength === 'good'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
            >
              {analysis.strengthLabel}
            </span>
          )}
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${analysis.strengthColor}`}
            style={{ width: analysis.progressWidth }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        {analysis.requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                req.met
                  ? 'bg-green-500 scale-100'
                  : 'bg-gray-300 scale-90'
              }`}
            >
              {req.met && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span
              className={`transition-colors duration-200 ${
                req.met ? 'text-slate-700 font-medium' : 'text-slate-500'
              }`}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>

      {/* Helpful Tip */}
      {password.length > 0 && analysis.metCount < 5 && (
        <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
          💡 <span className="font-medium">Tip:</span> A strong password helps keep your account secure.
        </div>
      )}
    </div>
  );
}

