// Stub for the "server-only" / "client-only" build-time guards, which throw
// unconditionally outside a Next.js webpack build. Tests run in plain
// Node/Vite, so these guards are meaningless there — alias them away.
export {};
