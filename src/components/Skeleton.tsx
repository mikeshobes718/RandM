import { FC } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[wave_1.5s_ease-in-out_infinite]',
    none: '',
  };

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Specialized skeleton components
export const CardSkeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-3xl border border-slate-200 bg-white p-6 ${className}`}>
    <Skeleton variant="rectangular" height={40} className="mb-4" />
    <Skeleton variant="text" className="mb-2" />
    <Skeleton variant="text" width="80%" className="mb-2" />
    <Skeleton variant="text" width="60%" />
  </div>
);

export const DashboardSkeleton: FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <Skeleton variant="rectangular" width={200} height={32} />
      <Skeleton variant="rectangular" width={120} height={40} />
    </div>
    
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
          <Skeleton variant="text" width={80} height={16} className="mb-3" />
          <Skeleton variant="rectangular" width={60} height={36} className="mb-2" />
          <Skeleton variant="text" width="90%" height={12} />
        </div>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Skeleton variant="rectangular" width={150} height={24} className="mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1">
                <Skeleton variant="text" className="mb-2" />
                <Skeleton variant="text" width="70%" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <Skeleton variant="rectangular" width={150} height={24} className="mb-6" />
        <Skeleton variant="rectangular" height={200} />
      </div>
    </div>
  </div>
);

export const TableSkeleton: FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className="border-b border-slate-200 p-4">
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" width={100} height={20} />
        ))}
      </div>
    </div>
    <div className="divide-y divide-slate-200">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex gap-4">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} variant="text" width={j === 0 ? 150 : 100} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FormSkeleton: FC = () => (
  <div className="space-y-6">
    {[...Array(4)].map((_, i) => (
      <div key={i}>
        <Skeleton variant="text" width={120} height={16} className="mb-2" />
        <Skeleton variant="rectangular" height={44} />
      </div>
    ))}
    <div className="flex gap-3">
      <Skeleton variant="rectangular" width={120} height={44} />
      <Skeleton variant="rectangular" width={100} height={44} />
    </div>
  </div>
);

