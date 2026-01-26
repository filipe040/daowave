const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const certsDir = path.join(__dirname, '..', 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Get local IP for SAN
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

// Try Node.js method first (no OpenSSL needed)
function generateWithNode() {
  try {
    const forge = require('node-forge');
    const pki = forge.pki;

    console.log('   (Usando Node.js para gerar certificados...)');
    
    // Generate key pair
    const keys = pki.rsa.generateKeyPair(2048);

    // Create certificate
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const localIP = getLocalIP();

    // Set certificate attributes
    const attrs = [
      { name: 'countryName', value: 'PT' },
      { name: 'stateOrProvinceName', value: 'Lisboa' },
      { name: 'localityName', value: 'Lisboa' },
      { name: 'organizationName', value: 'Development' },
      { shortName: 'CN', value: 'localhost' }
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    // Add extensions
    const altNames = [
      { type: 2, value: 'localhost' },
      { type: 2, value: '*.localhost' },
      { type: 7, ip: '127.0.0.1' }
    ];
    if (localIP) {
      altNames.push({ type: 7, ip: localIP });
    }

    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'subjectAltName',
        altNames: altNames
      }
    ]);

    // Self-sign certificate
    cert.sign(keys.privateKey);

    // Convert to PEM
    const certPem = pki.certificateToPem(cert);
    const keyPem = pki.privateKeyToPem(keys.privateKey);

    return { certPem, keyPem, localIP };
  } catch (error) {
    return null;
  }
}

console.log('🔐 Gerando certificados SSL auto-assinados...\n');

// Try Node.js method first (no OpenSSL needed)
const nodeResult = generateWithNode();

if (nodeResult) {
  // Use Node.js method
  console.log('1. Gerando certificados (usando Node.js)...');
  fs.writeFileSync(path.join(certsDir, 'localhost-key.pem'), nodeResult.keyPem);
  fs.writeFileSync(path.join(certsDir, 'localhost.pem'), nodeResult.certPem);
  
  if (nodeResult.localIP) {
    console.log(`   ✅ Incluído IP da rede: ${nodeResult.localIP}`);
  }
  
  console.log('\n✅ Certificados SSL gerados com sucesso!');
  console.log(`📁 Localização: ${certsDir}`);
  console.log('\n⚠️  Nota: Estes são certificados auto-assinados.');
  console.log('   O browser mostrará um aviso de segurança - clique em "Avançado" e "Continuar".\n');
} else {
  // Fallback to OpenSSL
  console.log('⚠️  node-forge não encontrado. Tentando OpenSSL...\n');
  
  // Check if openssl is available
  try {
    execSync('openssl version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ OpenSSL não encontrado e node-forge não está disponível!');
    console.error('\nOpções:');
    console.error('1. Instalar node-forge (recomendado):');
    console.error('   cd apps/web');
    console.error('   npm install node-forge');
    console.error('   Depois execute: npm run generate:certs');
    console.error('\n2. Ou instale o OpenSSL:');
    console.error('   Windows: https://slproweb.com/products/Win32OpenSSL.html');
    console.error('   Mac: brew install openssl');
    console.error('   Linux: sudo apt-get install openssl');
    process.exit(1);
  }

  const localIP = getLocalIP();

  // Generate private key
  console.log('1. Gerando chave privada...');
  execSync(
    'openssl genrsa -out "' + path.join(certsDir, 'localhost-key.pem') + '" 2048',
    { stdio: 'inherit' }
  );

  // Generate certificate with SANs (Subject Alternative Names)
  console.log('2. Gerando certificado com SANs...');
  if (localIP) {
    console.log(`   Incluindo IP da rede: ${localIP}`);
  }

  const certConfig = `
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C=PT
ST=Lisboa
L=Lisboa
O=Development
CN=localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
${localIP ? `IP.3 = ${localIP}` : ''}
`;

  const configPath = path.join(certsDir, 'cert.conf');
  fs.writeFileSync(configPath, certConfig);

  try {
    execSync(
      `openssl req -new -x509 -key "${path.join(certsDir, 'localhost-key.pem')}" -out "${path.join(certsDir, 'localhost.pem')}" -days 365 -config "${configPath}" -extensions v3_req`,
      { stdio: 'inherit' }
    );
    // Clean up config file
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  } catch (error) {
    // Fallback to simple certificate if SANs fail
    console.log('   (Tentativa com certificado simples...)');
    execSync(
      `openssl req -new -x509 -key "${path.join(certsDir, 'localhost-key.pem')}" -out "${path.join(certsDir, 'localhost.pem')}" -days 365 -subj "/C=PT/ST=Lisboa/L=Lisboa/O=Development/CN=localhost"`,
      { stdio: 'inherit' }
    );
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
  
  console.log('\n✅ Certificados SSL gerados com sucesso!');
  console.log(`📁 Localização: ${certsDir}`);
  console.log('\n⚠️  Nota: Estes são certificados auto-assinados.');
  console.log('   O browser mostrará um aviso de segurança - clique em "Avançado" e "Continuar".\n');
}
