const fs = require('fs');
const path = require('path');
const https = require('https');

const outputDir = path.join(__dirname, '..', 'public', 'recipes');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const images = [
  ['panqueca-banana.jpg', 'healthy banana oat pancakes'],
  ['bolo-banana.jpg', 'banana oatmeal cake healthy'],
  ['bolo-maca.jpg', 'apple cinnamon healthy cake'],
  ['iogurte-frutas.jpg', 'yogurt fruit granola bowl'],
  ['sanduiche-frango.jpg', 'healthy chicken sandwich'],
  ['wrap-atum.jpg', 'tuna wrap healthy'],
  ['tapioca-queijo.jpg', 'tapioca cheese breakfast'],
  ['cuscuz-ovo.jpg', 'couscous eggs breakfast'],
  ['arroz-feijao-frango.jpg', 'rice beans grilled chicken'],
  ['macarrao-patinho.jpg', 'healthy pasta ground beef vegetables'],
  ['tilapia-batata-doce.jpg', 'grilled fish sweet potato vegetables'],
  ['grao-bico-atum.jpg', 'chickpea tuna salad'],
  ['crepioca-queijo.jpg', 'cheese crepe breakfast'],
  ['vitamina-banana.jpg', 'banana oatmeal smoothie'],
  ['omelete-forno.jpg', 'vegetable omelette'],
  ['frango-batata-doce.jpg', 'chicken sweet potato meal'],
  ['tofu-arroz.jpg', 'tofu rice vegetables bowl'],
];

function downloadImage(filename, query) {
  return new Promise((resolve) => {
    const filePath = path.join(outputDir, filename);

    const url = `https://source.unsplash.com/900x700/?${encodeURIComponent(query)}`;

    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          https.get(response.headers.location, (redirectResponse) => {
            redirectResponse.pipe(file);

            file.on('finish', () => {
              file.close();
              console.log(`✅ ${filename}`);
              resolve();
            });
          }).on('error', () => {
            console.log(`❌ Erro ao baixar ${filename}`);
            resolve();
          });

          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`✅ ${filename}`);
          resolve();
        });
      })
      .on('error', () => {
        console.log(`❌ Erro ao baixar ${filename}`);
        resolve();
      });
  });
}

async function main() {
  console.log('Baixando imagens das receitas...\n');

  for (const [filename, query] of images) {
    await downloadImage(filename, query);
  }

  console.log('\nFinalizado! As imagens foram salvas em public/recipes.');
}

main();