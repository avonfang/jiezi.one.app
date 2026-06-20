// Test proxy support with various fetch implementations
const http = require('http');
const https = require('https');

const PROXY = 'http://127.0.0.1:7890';

// Test 1: via https-proxy-agent
console.log('=== Test 1: https-proxy-agent ===');
const { HttpsProxyAgent } = require('https-proxy-agent');
const agent = new HttpsProxyAgent(PROXY);
const req = https.get('https://vercel.com', { agent }, (res) => {
  console.log('Status:', res.statusCode);
  res.resume();
});
req.on('error', (e) => console.log('FAIL:', e.message));
req.end();

// Test 2: via native fetch
setTimeout(async () => {
  console.log('\n=== Test 2: Native fetch ===');
  try {
    const r = await fetch('https://vercel.com', {
      dispatcher: new (require('undici').ProxyAgent)(PROXY)
    });
    console.log('Status:', r.status);
  } catch (e) {
    console.log('FAIL:', e.message);
  }

  // Test 3: native fetch WITHOUT proxy agent (to show it fails)
  console.log('\n=== Test 3: Native fetch WITHOUT proxy ===');
  try {
    const r = await fetch('https://vercel.com');
    console.log('Status:', r.status);
  } catch (e) {
    console.log('FAIL:', e.message);
  }

  // Test 4: proxy-agent auto-detection
  console.log('\n=== Test 4: proxy-agent ===');
  const ProxyAgent = require('proxy-agent').ProxyAgent;
  try {
    const r = await fetch('https://vercel.com', {
      dispatcher: new ProxyAgent()
    });
    console.log('Status:', r.status);
  } catch (e) {
    console.log('FAIL:', e.message);
  }
}, 1000);
