import React from 'react';

interface BrandMarkProps {
  className?: string;
}

/** Three-peak mountain range — the mark on the My Home truck. */
const BrandMark: React.FC<BrandMarkProps> = ({ className = 'h-9 w-9' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    className={`${className} flex-shrink-0`}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="50" cy="18" r="8" fill="#ff9900" />
    <path fill="#146eb4" d="M4 54 L18 30 L26 42 L34 14 L44 38 L50 26 L60 54 Z" />
  </svg>
);

export default BrandMark;
