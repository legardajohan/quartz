import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

interface R2Config {
  client: S3Client;
  bucket: string;
  publicBaseUrl: string;
}

let config: R2Config | null = null;

// Lectura perezosa: `process.env` solo se lee en el primer uso real (dentro de un
// request), nunca al cargar el módulo. `app.ts` llama a `dotenv.config()` después de
// resolver sus `import`, así que leer las variables en el top-level de este archivo
// las encontraría siempre vacías.
function getConfig(): R2Config {
  if (config) {
    return config;
  }

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
    throw new Error(
      'Faltan variables de entorno para Cloudflare R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL)'
    );
  }

  config = {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    }),
    bucket: R2_BUCKET,
    publicBaseUrl: R2_PUBLIC_URL.replace(/\/+$/, ''),
  };

  return config;
}

export async function uploadImage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const { client, bucket, publicBaseUrl } = getConfig();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${publicBaseUrl}/${key}`;
}

export async function getImage(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { client, bucket } = getConfig();

  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) return null;

    const buffer = Buffer.from(await result.Body.transformToByteArray());
    return { buffer, contentType: result.ContentType ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}

export async function deleteImage(key: string): Promise<void> {
  try {
    const { client, bucket } = getConfig();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    console.error(`No se pudo eliminar el objeto R2 "${key}":`, error);
  }
}

export function keyFromPublicUrl(url: string): string | null {
  const { publicBaseUrl } = getConfig();
  if (!url.startsWith(`${publicBaseUrl}/`)) {
    return null;
  }
  return url.slice(publicBaseUrl.length + 1);
}
