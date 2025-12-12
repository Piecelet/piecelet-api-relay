import { makeProxyRouter } from "@/_lib/proxy";

const metacritic = makeProxyRouter({
  stripPrefix: "/metacritic",
  upstreamBase: "https://ee.iva-api.com/api",
  headerMutator: (headers, c) => {
    headers.set("ocp-apim-subscription-key", c.env.METACRITIC_KEY);
    // Optional UA override via env; if not set, remove any incoming UA
    headers.delete("user-agent");
    if (c.env.METACRITIC_UA) headers.set("user-agent", c.env.METACRITIC_UA);
  },
  requiredEnv: ["METACRITIC_KEY"],
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
});

export default metacritic;
