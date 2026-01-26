// HTTP server that redirects to HTTPS
const { createServer } = require('http');
const { parse } = require('url');

const port = process.env.HTTP_PORT || 3001;

createServer((req, res) => {
  const hostname = req.headers.host?.split(':')[0] || 'localhost';
  const httpsPort = process.env.PORT || 3000;
  
  // Redirect to HTTPS
  const httpsUrl = `https://${hostname}:${httpsPort}${req.url}`;
  
  res.writeHead(301, { 
    'Location': httpsUrl,
    'Content-Type': 'text/html'
  });
  
  res.end(`<html><body><h1>Redirecting to HTTPS...</h1><p><a href="${httpsUrl}">Click here if not redirected</a></p></body></html>`);
}).listen(port, '0.0.0.0', () => {
  console.log(`\n🔀 Servidor HTTP (redireciona para HTTPS) na porta ${port}`);
  console.log(`   http://localhost:${port} -> https://localhost:${port - 1}\n`);
});

