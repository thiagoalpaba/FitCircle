const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const iconsDir = path.join(root, 'public', 'icons');

fs.mkdirSync(iconsDir, { recursive: true });

function fitCircleSvg({ maskable = false } = {}) {
  const scale = maskable ? 0.78 : 0.92;
  const centerY = 245;
  const radius = 88 * scale;
  const leftX = 224;
  const rightX = 292;

  return `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#FFFFFF"/>
  <circle cx="${leftX}" cy="${centerY}" r="${radius}" fill="#06D65E"/>
  <circle cx="${rightX}" cy="${centerY}" r="${radius}" fill="#05A84B"/>
</svg>
`.trim();
}

async function generateIcon(fileName, size, options = {}) {
  const svg = fitCircleSvg(options);

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(root, fileName));

  console.log(`Criado: ${fileName}`);
}

async function main() {
  fs.writeFileSync(
    path.join(iconsDir, 'icon.svg'),
    fitCircleSvg({ maskable: false }),
    'utf8'
  );

  await generateIcon('public/icons/icon-192.png', 192);
  await generateIcon('public/icons/icon-512.png', 512);
  await generateIcon('public/icons/maskable-512.png', 512, { maskable: true });
  await generateIcon('public/apple-touch-icon.png', 180);

  const manifest = {
    name: 'FitCircle',
    short_name: 'FitCircle',
    description: 'Plano alimentar, treinos e círculo de apoio em um só lugar.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F9FAFB',
    theme_color: '#22C55E',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  };

  fs.writeFileSync(
    path.join(root, 'public', 'manifest.webmanifest'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  fs.writeFileSync(
    path.join(root, 'public', 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log('');
  console.log('Ícones e manifests gerados com sucesso!');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
