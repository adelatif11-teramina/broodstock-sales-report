'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Shield } from 'lucide-react';

interface BrandLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  sm: { wrapper: 'h-8 w-8' },
  md: { wrapper: 'h-10 w-10' },
  lg: { wrapper: 'h-12 w-12' },
};

export default function BrandLogo({
  href = '/',
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}: BrandLogoProps) {
  const resolvedSize = sizeMap[size];
  const [imageError, setImageError] = React.useState(false);

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`relative ${resolvedSize.wrapper} aspect-square rounded-full overflow-hidden bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-navy)] shadow-md ring-1 ring-white/60 flex items-center justify-center`}
      >
        {!imageError ? (
          <Image
            src="/assets/cp-florida-logo.png"
            alt="CP Florida"
            fill
            sizes="(max-width: 768px) 32px, 48px"
            priority
            className="object-contain p-1"
            onError={() => setImageError(true)}
          />
        ) : (
          <Shield className={`${size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} text-white`} />
        )}
      </div>
      {showText && (
        <div className={`flex flex-col leading-tight ${textClassName}`}>
          <span className="text-lg font-extrabold text-white drop-shadow-sm">
            CP Florida
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            Sales Management
          </span>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="inline-flex items-center">
      {content}
    </Link>
  ) : (
    content
  );
}
