import { makeProxyRouter } from "@/_lib/proxy";

const rexxar = makeProxyRouter({
  stripPrefix: "/douban/rexxar",
  upstreamBase: "https://m.douban.com/rexxar/api/v2",
  headerMutator: (headers) => {
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.3",
    );
    headers.set("Referer", "https://m.douban.com/movie");
    headers.set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8");
  },
  cache: {
    enabled: true,
    ttl2xx: 1800,
    ttl404: 60,
    addDebugHeaders: true,
    removeClientCacheControl: true,
  },
});

export default rexxar;
