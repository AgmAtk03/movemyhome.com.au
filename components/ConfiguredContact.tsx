import React from 'react';
import { CONFIG, isEmailConfigured, isPhoneConfigured } from '../constants';

const ConfiguredContact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const email = isEmailConfigured();
  const phone = isPhoneConfigured();
  if (!email && !phone) return null;

  return (
    <p className={className}>
      {email ? CONFIG.COMPANY_EMAIL : null}
      {email && phone ? ' · ' : null}
      {phone ? <span className="whitespace-nowrap">{CONFIG.COMPANY_PHONE}</span> : null}
    </p>
  );
};

export default ConfiguredContact;
