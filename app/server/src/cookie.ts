import sql from './db';
import { randomBytes } from 'crypto';
export function getRandom128() {
  const buf = randomBytes(16); // 16 bytes = 128 bits
  return buf.toString('hex'); // already zero-padded, 32 chars
}

export async function getUniqueCookie() {
  const cookie = getRandom128();
  const cookies = await sql`
  SELECT cookie from cookies where cookie = ${cookie}
  `;
  // Here we check if we have somehow made a pre-existing cookie
  if (cookies.length === 0) {
    return cookie;
  }
  throw Error('FUUUUUUUUCK WHAT ARE THE FUCKING CHANCES');
}
