const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname });
const handle = app.getRequestHandler();

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const certsDir = path.join(__dirname, 'certs');
const keyPath = path.join(certsDir, 'localhost-key.pem');
const certPath = path.join(certsDir, 'localhost.pem');

// Check if certificates exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('❌ Certificados SSL não encontrados!');
  console.error('Execute primeiro: npm run generate:certs');
  process.exit(1);
}

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    const localIP = getLocalIP();
    console.log('\n🔐 Servidor HTTPS iniciado!\n');
    console.log(`📍 Local:    https://localhost:${port}`);
    console.log(`🌐 Rede:     https://${localIP}:${port}`);
    console.log(`\n📱 No telemóvel, aceda a: https://${localIP}:${port}/validator`);
    console.log(`⚠️  Aceite o aviso de certificado (é normal com certificados auto-assinados)\n`);
  });
});

