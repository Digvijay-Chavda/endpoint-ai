import { LegalPage, REPO_URL } from '@/components/LegalPage';

export const metadata = { title: 'Terms of Service — Endpoint' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="27 October 2026">
      <p>By signing in to or using Endpoint you agree to these terms.</p>

      <h2>The service</h2>
      <p>
        Endpoint lets you create mock API endpoints for development and testing. It is provided as is, without
        warranties, and may change, be limited or be discontinued at any time. It is not intended for production traffic
        or for storing important data.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Keep your account secure and use the service lawfully.</li>
        <li>Do not store personal, confidential or regulated data in mock responses. Mock URLs are public to anyone who has the link.</li>
        <li>Do not use the service to attack, overload or abuse other systems, to host malicious content, or to send excessive traffic to it.</li>
        <li>If you use your own Gemini API key, you are responsible for its usage and cost.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you create. You give us permission to store and serve it so the service can work.
        We may remove content or accounts that break these terms.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent allowed by law, the service is offered without liability for lost data, downtime or any indirect
        damages.
      </p>

      <h2>Contact</h2>
      <p>Questions: open an issue at <a href={REPO_URL}>{REPO_URL}</a>.</p>
    </LegalPage>
  );
}
