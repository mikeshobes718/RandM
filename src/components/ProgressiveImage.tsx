'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { Skeleton } from './Skeleton';

interface ProgressiveImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: React.ReactNode;
  showSkeleton?: boolean;
}

export default function ProgressiveImage({
  alt,
  fallback,
  showSkeleton = true,
  className = '',
  ...props
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (error && fallback) {
    return <>{fallback}</>;
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <div className="text-center text-slate-400 p-4">
          <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && showSkeleton && (
        <div className={`absolute inset-0 ${className}`}>
          <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
        </div>
      )}
      <Image
        {...props}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
      />
    </div>
  );
}

// Specialized variants
export function ProgressiveAvatar({ src, alt, size = 48, className = '', ...props }: 
  Omit<ProgressiveImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      fallback={
        <div 
          className={`flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 text-white font-semibold ${className}`}
          style={{ width: size, height: size }}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      }
      {...props}
    />
  );
}

