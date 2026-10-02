import React from 'react';

const Logo = ({ size = 38, className = '', style = {} }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
    >
      <defs>
        <linearGradient id="sfLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="sfLogoGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
        <filter id="sfLogoShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Background Squircle */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#sfLogoGrad)" filter="url(#sfLogoShadow)" />
      <rect x="2.5" y="2.5" width="59" height="59" rx="15.5" stroke="url(#sfLogoGlass)" strokeWidth="1.5" />

      {/* Search Lens Ring */}
      <circle cx="28" cy="28" r="12" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M37 37L48 48" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />

      {/* Precision AI Core Reticle */}
      <circle cx="28" cy="28" r="3.5" fill="#38bdf8" />
      <path d="M28 20V23M28 33V36M20 28H23M33 28H36" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export default Logo;
