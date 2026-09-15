import React from 'react';

interface BrandMarkProps {
  className?: string;
}

/** Three-peak mountain range with orange accent — My Home brand mark. */
const BrandMark: React.FC<BrandMarkProps> = ({ className = 'h-9 w-14' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 96"
    className={`${className} flex-shrink-0`}
    aria-hidden="true"
    focusable="false"
  >
    <polygon fill="#146eb4" points="38,86 80,10 122,86" />
    <polygon fill="#146eb4" points="14,86 46,36 82,86" />
    <polygon fill="#146eb4" points="78,86 114,36 146,86" />
    <polygon fill="#ffffff" points="50,86 80,38 110,86" />
    <polygon fill="#ff9900" points="56,86 80,48 104,86" />
  </svg>
);

export default BrandMark;
