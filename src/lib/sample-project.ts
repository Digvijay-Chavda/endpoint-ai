import { Prisma } from '@prisma/client';

type SampleEndpoint = Omit<Prisma.EndpointCreateWithoutProjectInput, 'path' | 'method' | 'responseBody'> & {
  path: string;
  method: string;
  responseBody: unknown;
};

const endpoints: SampleEndpoint[] = [
  {
    method: 'GET',
    path: '/users',
    // {{faker.*}} tokens are replaced with fresh random data on every request
    responseBody: [
      { id: '{{faker.string.uuid()}}', name: '{{faker.person.fullName()}}', email: '{{faker.internet.email()}}' },
      { id: '{{faker.string.uuid()}}', name: '{{faker.person.fullName()}}', email: '{{faker.internet.email()}}' },
      { id: '{{faker.string.uuid()}}', name: '{{faker.person.fullName()}}', email: '{{faker.internet.email()}}' },
    ],
  },
  {
    method: 'POST',
    path: '/users',
    statusCode: 201,
    responseHeaders: JSON.stringify({ Location: '/users/1' }),
    responseBody: { id: '{{faker.string.uuid()}}', name: 'New user', createdAt: '{{faker.date.recent()}}' },
  },
  {
    method: 'GET',
    path: '/profile',
    requireAuth: true,
    customAuthHeader: 'Bearer demo-token',
    responseBody: { id: 1, name: 'Demo User', plan: 'free' },
  },
  {
    method: 'GET',
    path: '/slow',
    latencyMs: 1500,
    responseBody: { message: 'This response was delayed by 1.5 seconds' },
  },
  {
    method: 'GET',
    path: '/flaky',
    errorRate: 0.3,
    errorStatusCode: 503,
    responseBody: { message: 'Worked this time — about 30% of calls return a 503 instead' },
  },
  {
    method: 'DELETE',
    path: '/users/1',
    statusCode: 204,
    responseBody: '',
  },
];

/** The one starter project every user gets on first sign-in, to show what the app does. */
export function sampleProject(): Omit<Prisma.ProjectCreateWithoutOwnerInput, 'endpoints'> & {
  endpoints: { create: Prisma.EndpointCreateWithoutProjectInput[] };
} {
  return {
    name: 'Sample API — start here',
    description:
      'A ready-made mock API. Open an endpoint with its open-in-new-tab button, call its URL from anywhere, and watch it appear in the Inspector tab. Edit or delete anything — it is yours.',
    endpoints: {
      create: endpoints.map(ep => ({
        ...ep,
        responseBody: typeof ep.responseBody === 'string' ? ep.responseBody : JSON.stringify(ep.responseBody, null, 2),
      })) as Prisma.EndpointCreateWithoutProjectInput[],
    },
  };
}
