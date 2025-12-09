import { makeProxyRouter } from "@/_lib/proxy";

const omdb = makeProxyRouter({
  stripPrefix: "/omdb",
  upstreamBase: "https://www.omdbapi.com",
  injectQuery: (params, c) => {
    // Ensure apikey is always present and from server env
    params.set("apikey", c.env.OMDB_KEY);
  },
  requiredEnv: ["OMDB_KEY"],
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
});

export default omdb;
