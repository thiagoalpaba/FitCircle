const fs = require('fs');

const path = 'src/App.tsx';
const backup = 'src/App.backup-before-text-fix.tsx';

fs.copyFileSync(path, backup);

let text = fs.readFileSync(path, 'utf8');

const u = (value) => JSON.parse(`"${value}"`);

const replacements = [
  // acentos minúsculos quebrados
  ['\\u00c3\\u00a1', '\\u00e1'], // á
  ['\\u00c3\\u00a0', '\\u00e0'], // à
  ['\\u00c3\\u00a2', '\\u00e2'], // â
  ['\\u00c3\\u00a3', '\\u00e3'], // ã
  ['\\u00c3\\u00a9', '\\u00e9'], // é
  ['\\u00c3\\u00aa', '\\u00ea'], // ê
  ['\\u00c3\\u00ad', '\\u00ed'], // í
  ['\\u00c3\\u00b3', '\\u00f3'], // ó
  ['\\u00c3\\u00b4', '\\u00f4'], // ô
  ['\\u00c3\\u00b5', '\\u00f5'], // õ
  ['\\u00c3\\u00ba', '\\u00fa'], // ú
  ['\\u00c3\\u00a7', '\\u00e7'], // ç

  // acentos maiúsculos quebrados
  ['\\u00c3\\u0081', '\\u00c1'], // Á
  ['\\u00c3\\u0089', '\\u00c9'], // É
  ['\\u00c3\\u008d', '\\u00cd'], // Í
  ['\\u00c3\\u0093', '\\u00d3'], // Ó
  ['\\u00c3\\u009a', '\\u00da'], // Ú
  ['\\u00c3\\u0087', '\\u00c7'], // Ç

  // símbolos quebrados
  ['\\u00e2\\u0080\\u00a2', '\\u2022'], // bullet
  ['\\u00e2\\u009c\\u0093', '\\u2713'], // check
  ['\\u00e2\\u0080\\u009c', '"'],
  ['\\u00e2\\u0080\\u009d', '"'],
  ['\\u00e2\\u0080\\u0098', "'"],
  ['\\u00e2\\u0080\\u0099', "'"],
  ['\\u00c2\\u00ba', '\\u00ba'],
  ['\\u00c2\\u00aa', '\\u00aa'],
  ['\\u00c2\\u00b7', '\\u00b7'],
  ['\\u00c2\\u00a0', ' '],

  // emojis quebrados mais comuns
  ['\\u00f0\\u009f\\u0091\\u008b', '\\ud83d\\udc4b'], // 👋
  ['\\u00f0\\u009f\\u008d\\u008e', '\\ud83c\\udf4e'], // 🍎
  ['\\u00f0\\u009f\\u008d\\u008c', '\\ud83c\\udf4c'], // 🍌
  ['\\u00f0\\u009f\\u0094\\u00a5', '\\ud83d\\udd25'], // 🔥
  ['\\u00e2\\u009a\\u00a1', '\\u26a1'], // ⚡
];

for (const [fromEscaped, toEscaped] of replacements) {
  text = text.split(u(fromEscaped)).join(u(toEscaped));
}

// correções específicas que podem sobrar
const direct = [
  ['Proteína', 'Proteína'],
  ['proteína', 'proteína'],
  ['disponível', 'disponível'],
  ['diária', 'diária'],
  ['Olá, d 👋', 'Olá 👋'],
  ['Olá,  👋', 'Olá 👋'],
  ['Olá, 👋', 'Olá 👋'],
];

for (const [from, to] of direct) {
  text = text.split(from).join(to);
}

fs.writeFileSync(path, text, 'utf8');

const leftovers = text
  .split(/\r?\n/)
  .map((line, idx) => ({ idx: idx + 1, line }))
  .filter(({ line }) => /Ã|Â|â|ðŸ|�/.test(line))
  .slice(0, 120);

console.log('Correcao aplicada.');
console.log('Backup salvo em:', backup);

if (leftovers.length) {
  console.log('\nAinda encontrei possiveis textos quebrados:');
  for (const item of leftovers) {
    console.log(item.idx + ': ' + item.line.trim());
  }
} else {
  console.log('\nNenhum padrao quebrado encontrado.');
}