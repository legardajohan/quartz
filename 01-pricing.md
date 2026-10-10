# Quartz — Análisis de precios para instituciones

> Versión de producto: **v1.0.0** · Fecha: 2026-10-08 · Moneda: **COP**, IVA no incluido · TRM de referencia: **1 USD ≈ 4.000 COP**

## 1. Resumen
- **Qué se vende:** SaaS de evaluación cualitativa para **Preescolar** (Prejardín, Jardín y Transición): Lista de Chequeo, Carta Comunicativa en PDF y Dashboard de avance.
- **A quién:** colegios y jardines privados y oficiales de Colombia. Cada institución es un inquilino con sus datos aislados.
- **Unidad de cobro:** suscripción por institución. En el lanzamiento, precio único por inquilino; después, escalonado según el **número de estudiantes de preescolar**. Docentes y sedes ilimitados.

## 2. Costo de infraestructura (solo se paga el backend)
| Pieza | Servicio | USD/mes | COP/mes aprox. |
|---|---|---|---|
| API (`quartz-api`) | DigitalOcean App Platform Basic, 1 GB RAM | 12 | 48.000 |
| Base de datos | MongoDB Atlas M0 (gratis) | 0 | 0 |
| Imágenes | Cloudflare R2, capa gratuita de 10 GB | 0 | 0 |
| Web (`quartz-web`) | Vercel Hobby | 0 | 0 |
| Correo transaccional | Brevo o Resend, capa gratuita | 0 | 0 |
| **Total** | | **≈ 12** | **≈ 48.000** |

- El PDF se genera en el navegador, así que no consume CPU del servidor.
- Las cifras son de referencia: validar en la calculadora de DigitalOcean antes de contratar.

### 2.1 Opciones en DigitalOcean (solo API)
| Opción | RAM / CPU | USD/mes | COP/mes | Comentario |
|---|---|---|---|---|---|
| App Platform Basic 512 MB | 512 MB, 1 vCPU compartida | 5 | 20.000 | Justo para Node + Express + Mongoose. Solo para piloto |
| **App Platform Basic 1 GB (recomendada)** | 1 GB, 1 vCPU compartida | **12** | **48.000** | Despliegue desde GitHub, HTTPS y reinicio automático. Holgada para el arranque |
| Droplet 1 GB | 1 GB, 1 vCPU | 6 | 24.000 | Más barata, pero hay que administrar Nginx, SSL, PM2 y las actualizaciones |
| App Platform Basic 2 GB | 2 GB, 1 vCPU | 25 | 100.000 | Cuando se superen ~100 instituciones activas |

### 2.2 Capacidad estimada de MongoDB Atlas M0 (gratis)
**Límites de M0:** 512 MB de almacenamiento, ~100 operaciones por segundo, 500 conexiones y sin backups automáticos.

**Supuestos del cálculo** (basados en `StudentValuation`, que es la colección más pesada porque embebe el texto de cada aprendizaje):
- 7 dimensiones × ~5 aprendizajes por estudiante y periodo.
- Valoración de un estudiante en un periodo ≈ **13 KB** (aprendizajes, conceptos, observaciones e índices).
- 4 periodos al año ≈ **55 KB por estudiante al año**, sumando su usuario. Docentes, plantillas, aprendizajes y sedes pesan poco frente a esto.
- Se usa el 80 % de los 512 MB (≈ 400 MB) para dejar margen.

| Escenario | Estudiantes totales | Inquilinos (prom. 80 estudiantes) |
|---|---|---|
| Año 1 (un año de historia) | **≈ 7.000** | **≈ 90** |
| Año 2 (dos años acumulados) | ≈ 3.600 | ≈ 45 |
| Año 3 (tres años acumulados) | ≈ 2.400 | ≈ 30 |

- La capacidad baja cada año porque las valoraciones de años anteriores se conservan.
- El límite de operaciones (~100/s) alcanza para ~200 docentes conectados a la vez. El pico se da al cierre de cada periodo.
- **Cuándo pasar a un plan pago:** al llegar a ~350 MB o cuando se necesiten backups. El siguiente paso es Atlas Flex (desde ~USD 8/mes, 5 GB) y luego M10 (~USD 57/mes, con backups).
- Las imágenes (R2, ≤ 40 KB por foto) no ocupan espacio en Mongo. Los 10 GB gratis de R2 alcanzan para ~250.000 fotos.

### 2.3 Punto de equilibrio
- Con el precio de lanzamiento (sección 3), **1 inquilino** paga la API de USD 12.
- Con ~30 inquilinos el ingreso es ≈ 1.470.000 COP al mes, frente a un costo de 48.000 COP; queda margen para migrar a Atlas Flex o M10 sin subir precios.

## 3. Precio de lanzamiento por inquilino (para conseguir los primeros clientes)
Precio **único por institución**, sin importar el número de estudiantes, mientras la base de clientes crece y se mantiene la capa gratuita de Mongo.

| Modalidad | Pago por periodo | Equivale a / mes | Descuento | **Pago total 12 meses** | Ahorro en 12 meses |
|---|---|---|---|---|---|
| **Mensual** | 49.000 | 49.000 | — | **588.000** (12 × 49.000) | — |
| **Semestral** | 249.900 | 41.650 | 15 % | **499.800** (2 × 249.900) | 88.200 |
| **Anual** | 441.000 | 36.750 | 25 % | **441.000** (1 pago) | 147.000 |

- **Tope sugerido:** hasta 150 estudiantes de preescolar por institución. Las más grandes pasan a los planes de la sección 4.
- **Precio fundador:** las primeras 20 instituciones conservan este precio durante 12 meses.
- **Argumento de campaña:** una institución de 80 niños paga **menos de 650 COP por niño al mes** (≈ 460 COP con el plan anual).
- Todas las funciones incluidas: docentes y sedes ilimitados, Lista de Chequeo, Carta Comunicativa, cargue masivo, descargue masivo y Dashboard.

## 4. Planes por tamaño (después del lanzamiento)
| Plan | Estudiantes de preescolar | Mensual | Semestral (−10%) | Anual (−20%) | Desde / estudiante / mes* |
|---|---|---|---|---|---|
| **Semilla** | Hasta 60 | 49.000 | 264.600 | 470.400 | 817 |
| **Crecer** | 61 – 200 | 99.000 | 534.600 | 950.400 | 495 |
| **Institucional** | 201 – 500 | 189.000 | 1.020.600 | 1.814.400 | 378 |
| **Red** | Más de 500 o varias instituciones | A convenir | A convenir | A convenir | — |

\* Precio mensual dividido por el tope del rango. Es el dato más fuerte para la campaña: **menos de 1.000 COP por niño al mes**.

### Qué incluye cada plan
| Incluye | Semilla | Crecer | Institucional | Red |
|---|:-:|:-:|:-:|:-:|
| Docentes y sedes ilimitados | ✅ | ✅ | ✅ | ✅ |
| Lista de Chequeo y Carta Comunicativa en PDF | ✅ | ✅ | ✅ | ✅ |
| Cargue masivo de usuarios (`.xlsx`) e invitación por correo | ✅ | ✅ | ✅ | ✅ |
| Descargue masivo de informes | ✅ | ✅ | ✅ | ✅ |
| Dashboard analítico (12 widgets) | Básico | ✅ | ✅ | ✅ |
| Onboarding y carga inicial de datos | Guía | 1 sesión | 2 sesiones | Dedicado |
| Soporte | Correo | Correo + WhatsApp | Prioritario | SLA |

## 5. Beneficios para la institución
- **Informes en minutos:** la Carta Comunicativa y la Lista de Chequeo se generan en PDF al momento, individual o masivo, con el escudo de la institución.
- **Concepto calculado:** el puntaje cualitativo (Logrado / En proceso / Con dificultad) se calcula solo. Menos errores y criterios uniformes entre docentes.
- **Arranque rápido:** cargue masivo desde Excel e invitaciones por correo; cada usuario crea su propia contraseña.
- **Visibilidad para coordinación:** el Dashboard muestra el avance del periodo por docente, dimensión y estudiante.
- **Adaptable:** cada institución configura sus dimensiones, periodos, sedes, jornadas y niveles ofertados.
- **Datos protegidos:** aislamiento total entre instituciones, acceso por rol y por sede, y PDFs que nunca se almacenan.
- **Sin instalación:** funciona en el navegador, en cualquier equipo.

## 6. Novedades v1.0.0
- **Modo descripción:** dimensiones que se valoran con texto libre, además de la lista de aprendizajes.
- **Descargue masivo de informes:** todos los PDF de un grupo en una sola acción.
- **Niveles ofertados:** Prejardín, Jardín y Transición configurables por institución.
- **Edición segura en equipo:** aviso de conflicto si dos personas editan a la vez, sin perder el borrador.
- **Recuperar contraseña** por correo con enlace de un solo uso.
- **Próximamente:** básica primaria y secundaria (1°–11°) con valoración cuantitativa.

## 7. Alineación con el MEN (Colombia)
| Norma / referente | Qué exige | Cómo lo cumple Quartz |
|---|---|---|
| Ley 115 de 1994 (art. 15–17) | Preescolar como nivel educativo, con grado obligatorio de Transición | Soporta Prejardín, Jardín y Transición por institución |
| Decreto 2247 de 1997 | Evaluación **cualitativa**, integral y continua, con informes descriptivos para las familias | Valoración Logrado / En proceso / Con dificultad y Carta Comunicativa |
| Decreto 1075 de 2015 (Decreto Único Reglamentario del Sector Educación) | Compila y conserva las normas del sector, incluidas las del Decreto 2247 de 1997 para Preescolar. Mantiene el **informe final de valoración** | Carta Comunicativa por periodo y PDF generado con la valoración más reciente, disponible como informe final |
| Ley 1804 de 2016 (Política De Cero a Siempre) | Atención integral y seguimiento al desarrollo de la primera infancia | Seguimiento por periodo y por estudiante en el Dashboard |
| Bases Curriculares para la Educación Inicial y Preescolar (MEN, 2017) | Trabajo por dimensiones del desarrollo | 7 dimensiones por defecto (Cognitiva, Comunicativa, Corporal, Estética, Ética, Espiritual, Socioafectiva), editables |
| Derechos Básicos de Aprendizaje (DBA) de Transición | Aprendizajes esperados como referente | Catálogo propio de aprendizajes esperados por dimensión y grado |
| Ley 1581 de 2012 (Habeas Data) | Protección de datos personales, en especial de menores | Aislamiento multi-institución, acceso por rol y sede, sin almacenar informes |

## 8. Enfoque de campañas
| Público | Mensaje clave | Canal sugerido | Plan a empujar |
|---|---|---|---|
| Rector / dueño de jardín | "Informes al MEN y a las familias, sin papeleo, por menos de 1.000 COP por niño" | Facebook/Instagram Ads, WhatsApp Business, visitas | Semilla anual |
| Coordinador / Jefe de Área | "Ve el avance de todos tus docentes en un Dashboard" | LinkedIn, webinars, ferias educativas | Crecer / Institucional |
| Docente de preescolar | "La Carta Comunicativa sale sola en PDF" | Grupos de docentes, TikTok/Reels con demo | Prueba gratis → referido |
| Secretarías de educación / redes de colegios | "Evaluación cualitativa estandarizada y datos protegidos" | Contacto directo, licitaciones | Red |

**Prioridad:** jardines privados pequeños y medianos (planes Semilla y Crecer). Deciden rápido y el ciclo de venta es corto.

## 9. Condiciones comerciales
- **Prueba gratis de 30 días** o un periodo académico piloto para una sede.
- **Onboarding incluido** en los pagos semestral y anual.
- Pago por transferencia, PSE o tarjeta.
- Cambio de plan en cualquier momento, prorrateado.
- Precios revisables cada año (ajuste por IPC). El IVA se suma según la normativa vigente.
