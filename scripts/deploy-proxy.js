/**
 * Proxy wrapper for Vercel CLI — patches global https/fetch BEFORE Vercel loads.
 * Run: node scripts/deploy-proxy.js
 */
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || 'http://127.0.0.1:7890';

async function main() {
  const { HttpsProxyAgent } = await import('https-proxy-agent');
  const http = require('http');
  const https = require('https');

  const agent = new HttpsProxyAgent(PROXY);

  // Patch global https.request
  const originalHttpsRequest = https.request;
  https.request = function patchedRequest(url, options, cb) {
    const urlStr = typeof url === 'string' ? url : url?.href || '';
    if (urlStr.includes('vercel.com')) {
      if (typeof options === 'function') { cb = options; options = {}; }
      if (!options) options = {};
      options.agent = agent;
      return originalHttpsRequest.call(this, url, options, cb);
    }
    return originalHttpsRequest.apply(this, arguments);
  };

  // Patch global fetch
  if (typeof globalThis.fetch === 'function') {
    const { ProxyAgent } = await import('undici');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = function patchedFetch(url, options = {}) {
      const urlStr = typeof url === 'string' ? url : url?.href || '';
      if (urlStr.includes('vercel.com')) {
        options.dispatcher = new ProxyAgent(PROXY);
      }
      return originalFetch.call(this, url, options);
    };
  }

  // Load Vercel CLI in same process
  process.env.HTTP_PROXY = PROXY;
  process.env.HTTPS_PROXY = PROXY;
  process.argv = [process.argv[0], 'vercel', '--prod', '--yes'];
  const { pathToFileURL } = require('url');
  const vcPath = 'C:/Users/蒋燕/node/node-v20.18.3-win-x64/node_modules/vercel/dist/vc.js';
  await import(pathToFileURL(vcPath).href);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
