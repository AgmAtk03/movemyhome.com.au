import assert from 'node:assert/strict';
import test from 'node:test';

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>): Promise<void> {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return fn().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

const MEMBER_ENV = {
  EMAILJS_SERVICE_ID: 'service_live',
  EMAILJS_PUBLIC_KEY: 'public_live',
  EMAILJS_PRIVATE_KEY: 'private_live',
  EMAILJS_CLIENT_TEMPLATE_ID: 'template_client',
  EMAILJS_BUSINESS_TEMPLATE_ID: 'template_business',
  VITE_COMPANY_EMAIL: 'removalsmyhome@gmail.com',
};

test('member signup reuses client then business templates, not a third member template', async () => {
  await withEnv(MEMBER_ENV, async () => {
    const calls: Array<Record<string, unknown>> = [];
    const orig = globalThis.fetch;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body || '{}')));
      return new Response('OK', { status: 200 });
    }) as typeof fetch;
    try {
      const { sendMemberSignupEmails } = await import('./emailjs');
      const result = await sendMemberSignupEmails({
        name: 'Sam Nguyen',
        email: 'sam@student.edu.au',
        discountCode: 'STUDENT5-ABCDEFGH',
      });
      assert.equal(result.skipped, false);
      assert.equal(result.customerSent, true);
      assert.equal(result.businessSent, true);
      assert.equal(calls.length, 2);
      const first = calls[0] as { template_id: string; accessToken?: string; template_params: Record<string, string> };
      const second = calls[1] as { template_id: string; template_params: Record<string, string> };
      assert.equal(first.template_id, 'template_client');
      assert.equal(second.template_id, 'template_business');
      assert.equal(first.accessToken, 'private_live');
      assert.equal(first.template_params.to_email, 'sam@student.edu.au');
      assert.equal(first.template_params.email_kind, 'member');
      assert.equal(first.template_params.discount_code, 'STUDENT5-ABCDEFGH');
      assert.equal(first.template_params.customer_name, 'Sam Nguyen');
      assert.match(first.template_params.job_details, /STUDENT5-ABCDEFGH/);
      assert.equal(second.template_params.to_email, 'removalsmyhome@gmail.com');
      assert.equal(second.template_params.email_kind, 'business');
      assert.equal(second.template_params.reply_to, 'sam@student.edu.au');
      assert.equal(second.template_params.user_email, 'sam@student.edu.au');
      assert.match(second.template_params.job_details, /STUDENT5-ABCDEFGH/);
      assert.equal(calls.some((row) => String((row as { template_id?: string }).template_id || '').includes('member')), false);
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('member signup reports partial send when the office email fails', async () => {
  await withEnv(MEMBER_ENV, async () => {
    let n = 0;
    const orig = globalThis.fetch;
    globalThis.fetch = (async () => {
      n += 1;
      if (n === 1) return new Response('OK', { status: 200 });
      return new Response('fail', { status: 500 });
    }) as typeof fetch;
    try {
      const { sendMemberSignupEmails } = await import('./emailjs');
      const result = await sendMemberSignupEmails({
        name: 'Sam Nguyen',
        email: 'sam@student.edu.au',
        discountCode: 'STUDENT5-ABCDEFGH',
      });
      assert.equal(result.customerSent, true);
      assert.equal(result.businessSent, false);
    } finally {
      globalThis.fetch = orig;
    }
  });
});
