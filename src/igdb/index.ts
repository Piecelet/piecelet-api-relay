import { makeProxyRouter } from "@/_lib/proxy";

const igdb = makeProxyRouter({
  stripPrefix: "/igdb",
  upstreamBase: "https://api.igdb.com/",
  headerMutator: (headers, c) => {
    headers.set("accept", "application/json");
    headers.set("authorization", `Bearer ${c.env.IGDB_KEY}`);
    headers.set("client-id", c.env.IGDB_CLIENT_ID);
  },
  requiredEnv: ["IGDB_KEY", "IGDB_CLIENT_ID"],
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
});

export default igdb;
