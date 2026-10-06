// Migración (ACAD-05): lleva los grados fuera del enum de Preescolar (`1ro…11mo` y similares)
// a `Transición` y fija `settings.offeredLevels` en las instituciones que aún no lo tienen,
// según los niveles en uso por sus usuarios. Idempotente. Ejecutar con:
//   node scripts/migrate-grade-levels.js
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

// Espejo de `GradeLevel` / `GRADE_LEVELS` (src/features/auth/auth.types.ts), orden 3→5 años.
const GRADE_LEVELS = ['Prejardín', 'Jardín', 'Transición'];
const FALLBACK_LEVEL = 'Transición';

async function migrateUsers(db) {
  const users = db.collection('users');
  const cursor = users.find({ gradesTaught: { $elemMatch: { $nin: GRADE_LEVELS } } });

  let modified = 0;
  for await (const user of cursor) {
    // Fuera del enum → Transición; se deduplica por si el usuario ya tenía Transición.
    const next = [...new Set(user.gradesTaught.map((g) => (GRADE_LEVELS.includes(g) ? g : FALLBACK_LEVEL)))];
    await users.updateOne({ _id: user._id }, { $set: { gradesTaught: next } });
    modified += 1;
  }
  return modified;
}

async function migrateGradeField(db, collectionName) {
  const result = await db.collection(collectionName).updateMany(
    { grade: { $exists: true, $nin: GRADE_LEVELS } },
    { $set: { grade: FALLBACK_LEVEL } }
  );
  return result.modifiedCount;
}

async function migrateOfferedLevels(db) {
  const institutions = db.collection('institutions');
  const pending = await institutions
    .find({ 'settings.offeredLevels': { $exists: false } }, { projection: { _id: 1, name: 1 } })
    .toArray();

  for (const institution of pending) {
    const inUse = await db.collection('users').distinct('gradesTaught', { institutionId: institution._id });
    const offeredLevels = GRADE_LEVELS.filter((level) => inUse.includes(level));
    const next = offeredLevels.length > 0 ? offeredLevels : [FALLBACK_LEVEL];
    await institutions.updateOne({ _id: institution._id }, { $set: { 'settings.offeredLevels': next } });
    console.log(`  · ${institution.name}: offeredLevels = [${next.join(', ')}]`);
  }
  return pending.length;
}

async function migrate() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  // Primero los grados: `offeredLevels` se deriva de los valores ya normalizados.
  const usersModified = await migrateUsers(db);
  const learningsModified = await migrateGradeField(db, 'learnings');
  const templatesModified = await migrateGradeField(db, 'checklistTemplates');

  console.log(`users (gradesTaught → ${FALLBACK_LEVEL}): ${usersModified}`);
  console.log(`learnings (grade → ${FALLBACK_LEVEL}): ${learningsModified}`);
  console.log(`checklistTemplates (grade → ${FALLBACK_LEVEL}): ${templatesModified}`);

  console.log('institutions (offeredLevels):');
  const institutionsModified = await migrateOfferedLevels(db);
  console.log(`institutions actualizadas: ${institutionsModified}`);

  await mongoose.disconnect();
}

migrate().catch((error) => {
  console.error('Error en la migración de niveles de Preescolar:', error);
  process.exit(1);
});
