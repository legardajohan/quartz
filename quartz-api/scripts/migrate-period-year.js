// Migración puntual (ACAD-02): deriva Period.year de startDate para los periodos
// creados antes de que el campo existiera. Ejecutar una sola vez con:
//   node scripts/migrate-period-year.js
require('dotenv').config();
const mongoose = require('mongoose');

const { MONGODB_URI, API_USER, API_PASSWORD } = process.env;

if (!MONGODB_URI || !API_USER || !API_PASSWORD) {
  console.error('Faltan variables de entorno para la conexión a MongoDB.');
  process.exit(1);
}

const mongoUri = MONGODB_URI
  .replace('<user>', encodeURIComponent(API_USER))
  .replace('<password>', encodeURIComponent(API_PASSWORD));

async function migrate() {
  await mongoose.connect(mongoUri);

  const result = await mongoose.connection.collection('periods').updateMany(
    { year: { $exists: false } },
    [{ $set: { year: { $year: '$startDate' } } }]
  );

  console.log(`Periodos actualizados: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

migrate().catch((error) => {
  console.error('Error en la migración de Period.year:', error);
  process.exit(1);
});
