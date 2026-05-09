const fs = require('fs');

const path = 'src/App.tsx';
const backup = 'src/App.backup-before-mojibake-lines.tsx';

fs.copyFileSync(path, backup);

const hasMojibake = (line) => /Ã|Â|â|ðŸ|�/.test(line);

const fixLine = (line) => {
  if (!hasMojibake(line)) return line;

  let fixed = Buffer.from(line, 'latin1').toString('utf8');

  // ajustes manuais para casos que podem sobrar
  fixed = fixed
    .replace(/�/g, '')
    .replace(/OlÃ¡/g, 'Olá')
    .replace(/PÃ£o/g, 'Pão')
    .replace(/francÃªs/g, 'francês')
    .replace(/CafÃ©/g, 'Café')
    .replace(/manhÃ£/g, 'manhã')
    .replace(/AlmoÃ§o/g, 'Almoço')
    .replace(/FeijÃ£o/g, 'Feijão')
    .replace(/MacarrÃ£o/g, 'Macarrão')
    .replace(/MaÃ§Ã£/g, 'Maçã')
    .replace(/MamÃ£o/g, 'Mamão')
    .replace(/MelÃ£o/g, 'Melão')
    .replace(/RequeijÃ£o/g, 'Requeijão')
    .replace(/Patinho moÃdo/g, 'Patinho moído')
    .replace(/TilÃ¡pia/g, 'Tilápia')
    .replace(/proteÃna/gi, (m) => m[0] === 'P' ? 'Proteína' : 'proteína')
    .replace(/opÃ§Ã£o/g, 'opção')
    .replace(/opÃ§Ãµes/g, 'opções')
    .replace(/refeiÃ§Ã£o/g, 'refeição')
    .replace(/refeiÃ§Ãµes/g, 'refeições')
    .replace(/restriÃ§Ã£o/g, 'restrição')
    .replace(/restriÃ§Ãµes/g, 'restrições')
    .replace(/vocÃª/g, 'você')
    .replace(/VocÃª/g, 'Você')
    .replace(/nÃ£o/g, 'não')
    .replace(/NÃ£o/g, 'Não')
    .replace(/jÃ¡/g, 'já')
    .replace(/JÃ¡/g, 'Já')
    .replace(/PrÃ³ximo/g, 'Próximo')
    .replace(/PRÃ“XIMO/g, 'PRÓXIMO')
    .replace(/PRÃ³XIMO/g, 'PRÓXIMO')
    .replace(/SaÃºde/g, 'Saúde')
    .replace(/mÃºsculos/g, 'músculos')
    .replace(/forÃ§a/g, 'força')
    .replace(/FrequÃªncia/g, 'Frequência')
    .replace(/SessÃµes/g, 'Sessões')
    .replace(/SeguranÃ§a/g, 'Segurança')
    .replace(/OrganizaÃ§Ã£o/g, 'Organização')
    .replace(/GlÃºten/g, 'Glúten')
    .replace(/CrustÃ¡ceos/g, 'Crustáceos')
    .replace(/BrÃ³colis/g, 'Brócolis')
    .replace(/grÃ£o/g, 'grão')
    .replace(/ChÃ¡/g, 'Chá')
    .replace(/chÃ¡/g, 'chá')
    .replace(/pÃ³/g, 'pó')
    .replace(/Ã¡gua/g, 'água')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã£/g, 'ã')
    .replace(/Ãµ/g, 'õ')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã§/g, 'ç')
    .replace(/â€¢/g, '•')
    .replace(/âœ“/g, '✓')
    .replace(/Â·/g, '·')
    .replace(/Â /g, ' ')
    .replace(/ðŸ‘‹/g, '👋')
    .replace(/ðŸ”¥/g, '🔥')
    .replace(/ðŸ’ª/g, '💪')
    .replace(/ðŸ¥—/g, '🥗')
    .replace(/ðŸŽ/g, '🍎')
    .replace(/ðŸŒ/g, '🍌')
    .replace(/ðŸ§‘/g, '🧑')
    .replace(/ðŸ’–/g, '💖')
    .replace(/ðŸ¦/g, '🦁')
    .replace(/â™¡/g, '♡')
    .replace(/âš¡/g, '⚡')
    .replace(/âœ¨/g, '✨');

  return fixed;
};

const original = fs.readFileSync(path, 'utf8');
const fixed = original
  .split(/\r?\n/)
  .map(fixLine)
  .join('\n');

fs.writeFileSync(path, fixed, 'utf8');

const leftovers = fixed
  .split(/\r?\n/)
  .map((line, index) => ({ line, index: index + 1 }))
  .filter(({ line }) => /Ã|Â|â|ðŸ|�/.test(line))
  .slice(0, 120);

console.log('Correção aplicada.');
console.log('Backup salvo em:', backup);

if (leftovers.length) {
  console.log('\nAinda encontrei possíveis textos quebrados:');
  leftovers.forEach(({ index, line }) => {
    console.log(`${index}: ${line.trim()}`);
  });
} else {
  console.log('\nNenhum padrão quebrado encontrado.');
}