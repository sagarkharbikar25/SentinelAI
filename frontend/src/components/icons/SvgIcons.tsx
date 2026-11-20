import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
}

/**
 * SentinelAI Brand Logo - High-tech cybersecurity shield with neural AI core
 */
export function SentinelLogoSvg({ className = 'size-8', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shieldGradBrand" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1570E0" />
          <stop offset="0.55" stopColor="#5BB8F0" />
          <stop offset="1" stopColor="#8FDDF7" />
        </linearGradient>
        <linearGradient id="coreGradBrand" x1="22" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1570E0" />
          <stop offset="1" stopColor="#0B4FA8" />
        </linearGradient>
        <filter id="softGlow" x="18" y="18" width="28" height="28" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>
      {/* Outer Shield with Chamfered Precision Contour */}
      <path
        d="M32 6L11 14.5V29.5C11 43.8 20.2 56.6 32 60C43.8 56.6 53 43.8 53 29.5V14.5L32 6Z"
        fill="url(#shieldGradBrand)"
        fillOpacity="0.12"
        stroke="url(#shieldGradBrand)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Interlocking Cryptographic Nexus Ring */}
      <circle
        cx="32"
        cy="32"
        r="14"
        stroke="#1570E0"
        strokeWidth="1.5"
        strokeDasharray="4 2.5"
        strokeOpacity="0.65"
      />
      {/* Neural Core Geometric Vault */}
      <polygon
        points="32,22 41,32 32,42 23,32"
        fill="url(#coreGradBrand)"
        filter="url(#softGlow)"
      />
      {/* Precision Core Apex */}
      <circle cx="32" cy="32" r="2.8" fill="#FFFFFF" />
      <circle cx="32" cy="32" r="1.2" fill="#8FDDF7" />
    </svg>
  );
}

/**
 * 1. Home Dashboard SVG Icon
 */
export function HomeSvg({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9.5Z" />
      <path d="M9 21V12H15V21" />
    </svg>
  );
}

/**
 * 2. Backup Vault SVG Icon
 */
export function VaultSvg({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 7.5V9.5M12 14.5V16.5M7.5 12H9.5M14.5 12H16.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * 3. Log & Audit SVG Icon
 */
export function AuditSvg({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" />
      <path d="M14 2V8H20" />
      <path d="M8 13H16M8 17H13" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * 4. Test Lab SVG Icon
 */
export function LabSvg({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 3H15M10 3V8.5L4.5 18C3.8 19.2 4.7 21 6 21H18C19.3 21 20.2 19.2 19.5 18L14 8.5V3" />
      <path d="M7 15H17" />
      <circle cx="10" cy="17.5" r="1" fill="currentColor" />
      <circle cx="14" cy="16.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

/**
 * 5. Settings SVG Icon
 */
export function SettingsSvg({ className = 'size-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15A1.65 1.65 0 0 0 20 16.3A2 2 0 0 1 18.3 19A1.65 1.65 0 0 0 17 19.4A1.65 1.65 0 0 0 16.3 20A2 2 0 0 1 13.6 20A1.65 1.65 0 0 0 13 18.7A1.65 1.65 0 0 0 11.7 18.7A1.65 1.65 0 0 0 11 20A2 2 0 0 1 8.3 20A1.65 1.65 0 0 0 7.6 18.7A1.65 1.65 0 0 0 6.3 18.7A2 2 0 0 1 4.6 16A1.65 1.65 0 0 0 4.6 14.7A1.65 1.65 0 0 0 4 13.4A2 2 0 0 1 4 10.7A1.65 1.65 0 0 0 5.3 10A1.65 1.65 0 0 0 5.3 8.7A2 2 0 0 1 8 6A1.65 1.65 0 0 0 9.3 5.3A1.65 1.65 0 0 0 10 4A2 2 0 0 1 12.7 4A1.65 1.65 0 0 0 14 5.3A1.65 1.65 0 0 0 15.3 5.3A2 2 0 0 1 18 8A1.65 1.65 0 0 0 18.7 9.3A1.65 1.65 0 0 0 20 10A2 2 0 0 1 20 12.7A1.65 1.65 0 0 0 18.7 13.4A1.65 1.65 0 0 0 19.4 15Z" />
    </svg>
  );
}

/**
 * Shield Verified SVG Icon
 */
export function ShieldCheckSvg({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
      <path d="M9 12L11 14L15 10" />
    </svg>
  );
}

/**
 * Shield Alert SVG Icon
 */
export function ShieldAlertSvg({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
      <path d="M12 8V12M12 16H12.01" />
    </svg>
  );
}

/**
 * Radar Activity Pulse SVG Icon
 */
export function ActivitySvg({ className = 'size-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
