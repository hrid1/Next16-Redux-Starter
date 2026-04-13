/**
 * Login routes must NOT wrap another ReduxProvider — the root layout already
 * provides a single store via <Providers>. A nested Provider would create an
 * empty second store and break auth (blink, wrong state).
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
