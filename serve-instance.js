#!/usr/bin/env node

/**
 * Simple server to serve OpenMCT instances with proxy support
 * Replicates webpack-dev-server proxy configuration
 * 
 * Usage: node serve-instance.js [instance-name] [port]
 * Example: node serve-instance.js development 8080
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const instanceName = process.argv[2] || 'development';
const port = parseInt(process.argv[3] || '8080', 10);
const instancePath = path.join(__dirname, 'instances', instanceName);

// Proxy configuration (matching webpack.dev.js)
const proxyUrl = process.env.PROXY_URL || 'http://localhost:8080';
const apiUrl = process.env.API_URL || '';
const proxyHeaders = {};

if (process.env.COOKIE) {
  proxyHeaders.Cookie = process.env.COOKIE;
}

const app = express();

// Proxy: /mcws-test -> http://localhost:8090
app.use('/mcws-test', createProxyMiddleware({
  target: 'http://localhost:8090',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug'
}));

// Proxy: /mcws -> apiUrl
if (apiUrl) {
  app.use('/mcws', createProxyMiddleware({
    target: apiUrl,
    changeOrigin: true,
    secure: false,
    headers: proxyHeaders,
    logLevel: 'debug'
  }));
}

// Proxy: /proxyUrl -> extract URL from query parameter and proxy to it
// This replicates webpack-dev-server behavior where pathRewrite returns the full URL
app.use('/proxyUrl', express.raw({ type: '*/*', limit: '50mb' }), async (req, res, next) => {
  let targetUrl = null;
  
  // Extract the 'url' parameter from the query string
  // We need to handle this carefully because the url parameter itself may contain query parameters
  const rawQuery = req.originalUrl?.split('?')[1] || req.url?.split('?')[1];
  
  if (rawQuery) {
    // Find the 'url=' parameter - it should be first
    // Extract everything from 'url=' until the first unencoded '&' (or end of string)
    const urlMatch = rawQuery.match(/^url=(.+?)(?:&|$)/);
    if (urlMatch) {
      try {
        const decodedUrl = decodeURIComponent(urlMatch[1]);
        console.log('Decoded URL from query:', decodedUrl);
        
        // Handle relative URLs or query strings (like webpack dev server does)
        if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
          targetUrl = decodedUrl;
        } else if (decodedUrl.startsWith('?')) {
          // Query string only - use request origin as base (like webpack dev server)
          const origin = `${req.protocol}://${req.get('host')}`;
          targetUrl = origin + decodedUrl;
        } else if (decodedUrl.startsWith('/')) {
          // Absolute path - use request origin as base
          const origin = `${req.protocol}://${req.get('host')}`;
          targetUrl = origin + decodedUrl;
        } else {
          // Relative path - use request origin + path
          const origin = `${req.protocol}://${req.get('host')}`;
          targetUrl = origin + '/' + decodedUrl;
        }
      } catch (e) {
        // Invalid URL encoding
        console.error('Error decoding URL:', e, 'Raw value:', urlMatch[1]);
        targetUrl = null;
      }
    }
  }
  
  if (!targetUrl) {
    console.error('Failed to extract valid URL from request:', req.originalUrl || req.url);
    return res.status(400).send('Missing or invalid url query parameter. The url parameter must be a valid HTTP/HTTPS URL.');
  }

  try {
    console.log('Generic URL Proxy to:', targetUrl);
    
    // Prepare headers - exclude headers that shouldn't be forwarded
    const headersToForward = { ...proxyHeaders };
    const headersToExclude = ['host', 'connection', 'content-length', 'transfer-encoding'];
    for (const [key, value] of Object.entries(req.headers)) {
      if (!headersToExclude.includes(key.toLowerCase())) {
        headersToForward[key] = value;
      }
    }
    
    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: headersToForward
    };
    
    // Forward request body for non-GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = req.body;
    }
    
    // Make a request to the target URL
    const response = await fetch(targetUrl, fetchOptions);

    // Forward response headers
    response.headers.forEach((value, key) => {
      // Exclude headers that Express handles
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    // Set status code
    res.status(response.status);

    // Forward response body
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('Proxy error:', e);
    if (!res.headersSent) {
      res.status(500).send('Proxy error: ' + e.message);
    }
  }
});

// Serve static files from instance directory
app.use(express.static(instancePath));

// Serve node_modules/openmct/dist if it exists
const openmctDistPath = path.join(instancePath, 'node_modules', 'openmct', 'dist');
app.use('/node_modules/openmct/dist', express.static(openmctDistPath));

// Serve test_data directory (matching webpack dev server configuration)
const testDataPath = path.join(__dirname, 'test_data');
app.use('/test_data', express.static(testDataPath));

app.listen(port, () => {
  console.log(`Serving instance "${instanceName}" at http://localhost:${port}`);
  console.log(`Instance path: ${instancePath}`);
  console.log(`Proxy configuration:`);
  console.log(`  /mcws-test -> http://localhost:8090`);
  if (apiUrl) {
    console.log(`  /mcws -> ${apiUrl}`);
  }
  console.log(`  /proxyUrl -> ${proxyUrl} (with query.url rewriting)`);
  if (Object.keys(proxyHeaders).length > 0) {
    console.log(`  Proxy headers:`, proxyHeaders);
  }
});

