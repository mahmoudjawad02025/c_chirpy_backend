import { db } from "../index.js";
import { NewUser, User, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

 
export async function clearUsers() {
  const [result] = await db.delete(users).returning();
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


// export async function getUsers() {
//   const result = await db.select({name: users.name}).from(users);
//   return result;
// }