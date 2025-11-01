// Force all API routes to be dynamic (server-side rendered)
// This is required because API routes use request.headers, request.url, etc.
export const dynamic = 'force-dynamic';

export default function ApiLayout({ children }) {
  return children;
}
