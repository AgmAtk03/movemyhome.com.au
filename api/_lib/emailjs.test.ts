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

test('member signup emails the student then the office with the same template', async () => {
  await withEnv({
    EMAILJS_SERVICE_ID: 'service_live',
    EMAILJS_PUBLIC_KEY: 'public_live',
    EMAILJS_PRIVATE_KEY: 'private_live',
    EMAILJS_MEMBER_TEMPLATE_ID: 'template_member',
    VITE_COMPANY_EMAIL: 'removalsmyhome@gmail.com',
  }, async () => {
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
      assert.equal(first.template_id, 'template_member');
      assert.equal(second.template_id, 'template_member');
      assert.equal(first.accessToken, 'private_live');
      assert.equal(first.template_params.to_email, 'sam@student.edu.au');
      assert.equal(first.template_params.email_kind, 'member_customer');
      assert.equal(first.template_params.discount_code, 'STUDENT5-ABCDEFGH');
      assert.equal(second.template_params.to_email, 'removalsmyhome@gmail.com');
      assert.equal(second.template_params.email_kind, 'member_business');
      assert.equal(second.template_params.reply_to, 'sam@student.edu.au');
      assert.equal(second.template_params.user_email, 'sam@student.edu.au');
    } finally {
      globalThis.fetch = orig;
    }
  });
});

test('member signup reports partial send when the office email fails', async () => {
  await withEnv({
    EMAILJS_SERVICE_ID: 'service_live',
    EMAILJS_PUBLIC_KEY: 'public_live',
    EMAILJS_MEMBER_TEMPLATE_ID: 'template_member',
    VITE_COMPANY_EMAIL: 'removalsmyhome@gmail.com',
  }, async () => {
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
