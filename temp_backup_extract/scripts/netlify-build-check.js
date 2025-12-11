// Netlify Build Check - Verify environment variables
console.log('=== NETLIFY BUILD CHECK ===');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('SERPAPI_KEY configured:', !!process.env.SERPAPI_KEY);
console.log('SERPAPI_KEY length:', process.env.SERPAPI_KEY?.length || 0);
console.log('===========================');
