import { LegalPage, REPO_URL } from '@/components/LegalPage';

export const metadata = { title: 'Privacy Policy — Endpoint' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="27 October 2026">
      <p>
        Endpoint is a tool for creating mock APIs. This page explains what information the service handles and why.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Google account details.</strong> When you sign in with Google we receive your name, email address, profile photo and a Google account identifier. We use them only to identify your account and show who is signed in.</li>
        <li><strong>Content you create.</strong> Projects, endpoint settings and the response bodies you write, generate or import.</li>
        <li><strong>Request logs.</strong> Requests made to your mock URLs are stored for the Request Inspector: method, path, query string, headers, body and response. Authorization header values are shortened and cookies are redacted. Only the latest 500 requests per project are kept, and bodies are truncated.</li>
        <li><strong>A session cookie.</strong> A secure, signed cookie keeps you signed in. We do not use advertising or analytics cookies.</li>
      </ul>

      <h2>AI features</h2>
      <p>
        When you use the AI Payload Generator, your prompt is sent to Google&apos;s Gemini API to produce a response. If you
        enter your own Gemini API key, it is stored only in your browser and sent with your requests to our server, which
        forwards it to Google. We do not store it on our servers.
      </p>

      <h2>Who can see your data</h2>
      <p>
        Your projects are private to your account. The mock URLs you create are public by design: anyone who has a URL can
        call it and receive its response, so do not put secrets or personal data in mock responses. We do not sell your
        data or share it with third parties, other than the infrastructure providers that host the service (hosting,
        database) and Google for sign-in and AI generation.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        Deleting a project permanently deletes its endpoints and request logs. To have your account and all of its data
        removed, contact us using the link below.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or deletion requests: open an issue at <a href={REPO_URL}>{REPO_URL}</a>.
      </p>
    </LegalPage>
  );
}
