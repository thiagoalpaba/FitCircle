const fs = require('fs');
const path = require('path');

const files = [
  'src/App.tsx',
  'src/data/mealConfigs.ts',
  'src/data/social.ts',
  'src/data/demo.ts',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, 'utf8');

  // Backup individual
  fs.writeFileSync(`${file}.backup-before-emoji-fix`, text, 'utf8');

  // Remove sequências quebradas comuns de emoji/mojibake
  text = text
    .replace(/ðŸ[\s\S]{0,6}?/g, '')
    .replace(/�/g, '')
    .replace(/x9/g, '')
    .replace(/xa/g, '')
    .replace(/x`/g, '')
    .replace(/xR"/g, '')
    .replace(/xR'/g, '')
    .replace(/x}/g, '')
    .replace(/x\}/g, '')
    .replace(/x□/g, '')
    .replace(/x�/g, '')
    .replace(/Partner\s*x+/g, 'Partner')
    .replace(/Olá,\s*s\s*x+/g, 'Olá')
    .replace(/Olá,\s*x+/g, 'Olá')
    .replace(/Olá,\s*[, ]+/g, 'Olá, ')
    .replace(/Círculo em chamas!\s*/g, 'Círculo em chamas!')
    .replace(/Vocês estão mantendo a consistência juntos\./g, 'Vocês estão mantendo a consistência juntos.');

  // Troca avatars quebrados por letras seguras
  text = text
    .replace(/avatar:\s*'[^']*Você[^']*'/g, "avatar: 'V'")
    .replace(/avatar:\s*'🧑'/g, "avatar: 'V'")
    .replace(/avatar:\s*'🦁'/g, "avatar: 'P'")
    .replace(/avatar:\s*'[^']*'/g, (match) => {
      if (match.includes("avatar: 'A'")) return match;
      if (match.includes("avatar: 'L'")) return match;
      if (match.includes("avatar: 'V'")) return match;
      if (match.includes("avatar: 'P'")) return match;
      return match;
    });

  // Corrige bloco conhecido de membros se existir
  text = text
    .replace(/avatar:\s*'🧑'/g, "avatar: 'V'")
    .replace(/avatar:\s*'🦁'/g, "avatar: 'P'");

  // Corrige nomes quebrados
  text = text
    .replace(/name:\s*'Partner[^']*'/g, "name: 'Partner'")
    .replace(/member:\s*'Partner[^']*'/g, "member: 'Partner'")
    .replace(/name:\s*'Você[^']*'/g, "name: 'Você'")
    .replace(/member:\s*'Você[^']*'/g, "member: 'Você'");

  // Remove emojis quebrados em mensagens rápidas
  text = text
    .replace(/Mandou bem no prato![^']*'/g, "Mandou bem no prato!'")
    .replace(/Refeição nota 10![^']*'/g, "Refeição nota 10!'")
    .replace(/Equilíbrio perfeito![^']*'/g, "Equilíbrio perfeito!'")
    .replace(/Inspiração para o grupo![^']*'/g, "Inspiração para o grupo!'")
    .replace(/Foco na meta![^']*'/g, "Foco na meta!'")
    .replace(/Continua firme![^']*'/g, "Continua firme!'")
    .replace(/Não para agora![^']*'/g, "Não para agora!'")
    .replace(/Você consegue![^']*'/g, "Você consegue!'");

  // Corrige possíveis ícones emoji das refeições para texto/letra segura se existirem
  text = text
    .replace(/emoji:\s*'[^']*'/g, (match) => {
      if (match.includes('cafe') || match.includes('Café')) return "emoji: 'C'";
      return match;
    });

  fs.writeFileSync(file, text, 'utf8');
}

console.log('Correção de emojis quebrados aplicada nos arquivos existentes.');
console.log('Agora rode: npm.cmd run build');