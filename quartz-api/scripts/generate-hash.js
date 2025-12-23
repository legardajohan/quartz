const bcrypt = require('bcryptjs');

const passwords = [
  { name: 'Maira', pass: 'YasRojas#25' },
  { name: 'Johan', pass: 'Jall1505&' }
];

const saltRounds = 10;

console.log('--- Hashes Generados ---');

passwords.forEach(user => {
  try {
    const hash = bcrypt.hashSync(user.pass, saltRounds);
    console.log(`Usuario: ${user.name}`);
    console.log(`Password: ${user.pass}`);
    console.log(`Hash: ${hash}\n`);
  } catch (error) {
    console.error(`Error generando hash para ${user.name}:`, error);
  }
});

console.log('Copia y pega cada hash en el script de inserción de MongoDB.');
