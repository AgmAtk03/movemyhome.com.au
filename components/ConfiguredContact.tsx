import React from 'react';
import { CONFIG, isEmailConfigured } from '../constants';
import { safeMailtoHref } from '../lib/sanitize';
import ContactActions from './ContactActions';

const ConfiguredContact: React.FC<{ className?: string; includePhone?: boolean }> = ({
  className = '',
  includePhone = true,
}) => {
  const mail = isEmailConfigured() ? safeMailtoHref(CONFIG.COMPANY_EMAIL) : null;

  return (
    <div className={className}>
      {mail && (
        <p>
          <a
            href={mail}
            className="inline-flex min-h-11 items-center font-bold text-[#146eb4] underline decoration-[#146eb4]/40 underline-offset-2"
            aria-label={`Email ${CONFIG.COMPANY_NAME} at ${CONFIG.COMPANY_EMAIL}`}
          >
            {CONFIG.COMPANY_EMAIL}
          </a>
        </p>
      )}
      {includePhone ? <ContactActions variant="inline" /> : null}
    </div>
  );
};

export default ConfiguredContact;
