import { db } from "../index.js";
import { chirps, Chirp, NewChirp } from "../schema.js";
import { eq, desc } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .onConflictDoNothing()
    .returning();
  return result;
}

 
export async function clearChirps() {
  const [result] = await db.delete(chirps).returning();
  return result;
}


export async function getChirps() {
  const result = await db.select().from(chirps).orderBy(chirps.createdAt);
  return result;
}


export async function getChirpById(id: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
  return result;
}


export async function deleteChirp(id: string) {
  const [result] = await db.delete(chirps).where(eq(chirps.id, id)).returning();
  return result;
}


// export async function getUserByName(name: string) {
//   const [result] = await db.select().from(users).where(eq(users.name, name));
//   return result;
// }


// export async function getUserById(id: any) {
//   const [result] = await db.select().from(users).where(eq(users.id, id));
//   return result;
// }


