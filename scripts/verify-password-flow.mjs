const baseUrl = process.env.PORTAL_TEST_BASE_URL || "http://localhost:3000";
const password = process.env.PORTAL_ACCESS_PASSWORD;

if (!password) {
  throw new Error("PORTAL_ACCESS_PASSWORD is not configured");
}

const trpcInput = (value) => JSON.stringify({ 0: { json: value } });

const login = await fetch(`${baseUrl}/api/trpc/portal.passwordLogin?batch=1`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: trpcInput({ password }),
});

if (!login.ok) throw new Error(`Password login returned ${login.status}`);
const setCookie = login.headers.get("set-cookie");
if (!setCookie?.includes("rukai_portal_access=")) throw new Error("Password login did not issue a session cookie");
const cookie = setCookie.split(";")[0];

const statusUrl = `${baseUrl}/api/trpc/portal.passwordStatus?batch=1&input=${encodeURIComponent(trpcInput(null))}`;
const authenticatedStatus = await fetch(statusUrl, { headers: { cookie } });
const authenticatedBody = await authenticatedStatus.text();
if (!authenticatedStatus.ok || !authenticatedBody.includes('"authenticated":true')) {
  throw new Error("Authenticated session status check failed");
}

const dashboardUrl = `${baseUrl}/api/trpc/portal.dashboard?batch=1&input=${encodeURIComponent(trpcInput(null))}`;
const dashboard = await fetch(dashboardUrl, { headers: { cookie } });
if (!dashboard.ok) throw new Error(`Protected dashboard returned ${dashboard.status}`);

const logout = await fetch(`${baseUrl}/api/trpc/portal.passwordLogout?batch=1`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: trpcInput(null),
});
if (!logout.ok || !logout.headers.get("set-cookie")?.includes("Max-Age=-1")) {
  throw new Error("Password logout did not clear the session cookie");
}

console.log("Password flow verified: login, session, protected dashboard, and logout.");
