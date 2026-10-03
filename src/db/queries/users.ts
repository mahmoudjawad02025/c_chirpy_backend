import { db } from "../index.js";
import { NewUser, User, users } from "../schema.js";
import { eq } from "drizzle-orm";


export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}


export async function updateUser(user: NewUser) {
  const [result] = await db
    .update(users)
    .set(user)
    .where(eq(users.id, user.id!))
    .returning();
  return result;
}

 
export async function clearUsers() {
  const [result] = await db.delete(users).returning();
  return result;
}


export async function getUserByEmail(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result;
}


export function upgradeUserToChirpyRed(id: string) {
  return db
    .update(users)
    .set({ isChirpyRed: true })
    .where(eq(users.id, id))
    .returning();
}

// export async function setUserExpiresInSeconds(id: string, expiresInSeconds: number) {
//   const [result] = await db
//     .update(users)
//     .set({ expiresInSeconds: new Date(Date.now() + expiresInSeconds) })
//     .where(eq(users.id, id))
//     .returning();
//   return result;
// }

// export async function getUserById(id: any) {
//   const [result] = await db.select().from(users).where(eq(users.id, id));
//   return result;
// }


// export async function getUsers() {
//   const result = await db.select({name: users.name}).from(users);
//   return result;
// }