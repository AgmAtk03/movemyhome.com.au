import React from 'react';

interface BrandMarkProps {
  className?: string;
}

/** My Home Canva brand mark from /logo.png. */
const BrandMark: React.FC<BrandMarkProps> = ({ className = 'h-9 w-9' }) => (
  <img
    src="/logo.png"
    alt=""
    width={72}
    height={72}
    className={`${className} object-contain rounded-lg flex-shrink-0 bg-white`}
    decoding="async"
  />
);

export default BrandMark;
