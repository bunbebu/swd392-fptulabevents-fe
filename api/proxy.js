// Vercel Serverless Function to proxy API requests to backend
// This avoids Mixed Content issues by making requests server-side

const BACKEND_URL = 'http://swd392group6.runasp.net';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get the path from query parameter
    const path = req.query.path || '';

    // Forward all other query parameters (except 'path')
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path') {
        queryParams.append(key, value);
      }
    }
    const queryString = queryParams.toString();
    const targetUrl = `${BACKEND_URL}/${path}${queryString ? '?' + queryString : ''}`;

    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    console.log('Request body:', req.body);

    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      }
    };

    // Only add body for methods that support it (not GET or HEAD)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body && Object.keys(req.body).length > 0) {
        // req.body is already parsed by Vercel
        fetchOptions.body = JSON.stringify(req.body);
      }
    }

    // Forward the request to backend
    const response = await fetch(targetUrl, fetchOptions);

    // Get response data
    const data = await response.text();

    // Forward response status and headers
    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');

    // Send response
    res.send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
};
