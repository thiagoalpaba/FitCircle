const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join(__dirname, '..', 'public', 'recipes');

const images = [
  ['aveia-gelada-banana.jpg', 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=900&q=80'],
  ['panqueca-banana-aveia.jpg', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80'],
  ['tapioca-banana-canela.jpg', 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80'],
  ['bolo-fit-banana-aveia.jpg', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80'],
  ['bolo-fit-maca-canela.jpg', 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=900&q=80'],
  ['wrap-frango.jpg', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80'],
  ['wrap-homus-salada.jpg', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80'],
  ['sanduiche-atum.jpg', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80'],
  ['sanduiche-frango.jpg', 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=900&q=80'],
  ['omelete-queijo-tomate.jpg', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80'],
  ['cuscuz-banana-chia.jpg', 'https://images.unsplash.com/photo-1541599188778-cdc73298e8e8?auto=format&fit=crop&w=900&q=80'],
  ['bowl-frango-quinoa.jpg', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'],
  ['bowl-tofu-grao-bico.jpg', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'],
  ['macarrao-atum.jpg', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80'],
  ['batata-lentilha-salada.jpg', 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&w=900&q=80'],
  ['pipoca-queijo-fruta.jpg', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=900&q=80'],
  ['pipoca-fruta-chia.jpg', 'https://images.unsplash.com/photo-1519096845289-95806ee03a1a?auto=format&fit=crop&w=900&q=80'],
  ['smoothie-morango-iogurte.jpg', 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=900&q=80'],
  ['vitamina-banana-aveia-sem-leite.jpg', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=900&q=80'],
  ['mousse-proteico-chocolate.jpg', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80'],
  ['banana-canela.jpg', 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=900&q=80'],
];

fs.mkdirSync(OUT_DIR, { recursive: true });

function download(url, filename) {
  const filePath = path.join(OUT_DIR, filename);

  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      console.log(`Já existe: ${filename}`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          fs.unlinkSync(filePath);
          download(response.headers.location, filename).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(filePath);
          reject(new Error(`Erro ${response.statusCode} ao baixar ${filename}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`Baixou: ${filename}`);
          resolve();
        });
      })
      .on('error', (error) => {
        file.close();
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(error);
      });
  });
}

async function main() {
  for (const [filename, url] of images) {
    await download(url, filename);
  }

  console.log('\nImagens salvas em public/recipes');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
