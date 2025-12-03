import argon2 from "argon2";
import { getCollection } from "./database.service";

/**
 * Create a guest user once, using env-provided credentials.
 * Safe to call multiple times; it checks existence by email.
 */
export async function seedGuestUser() {
  const email = process.env.GUEST_EMAIL;
  const username = process.env.GUEST_USERNAME;
  const password = process.env.GUEST_PASSWORD;
  const displayName = process.env.GUEST_NAME; // optional
  const collectionName = process.env.USER_DETAILS_COLLECTION_NAME || "UsersDetails";

  if (!email || !username || !password) {
    console.warn("Guest seed skipped: missing GUEST_EMAIL / GUEST_USERNAME / GUEST_PASSWORD");
    return;
  }

  try {
    const users = getCollection(collectionName);
    const existing = await users.findOne({ email });
    if (existing) {
      console.log(`Guest seed: user ${email} already exists, skipping`);
      return;
    }

    const hashed = await argon2.hash(password);
    const now = new Date().toISOString();
    const doc: Record<string, any> = {
      email,
      username,
      password: hashed,
      createdAt: now,
      isAdmin: false,
    };
    if (displayName) {
      doc.name = displayName;
    }

    await users.insertOne(doc);
    console.log(`Guest seed: created user ${email}`);
  } catch (err) {
    console.error("Guest seed failed:", err);
  }
}

export async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const displayName = process.env.ADMIN_NAME; // optional
  const collectionName = process.env.USER_DETAILS_COLLECTION_NAME || "UsersDetails";

  if (!email || !username || !password) {
    console.warn("Admin seed skipped: missing ADMIN_EMAIL / ADMIN_USERNAME / ADMIN_PASSWORD");
    return;
  }

  try {
    const users = getCollection(collectionName);
    const existing = await users.findOne({ email });
    if (existing) {
      if(!existing.isAdmin) {
        await users.updateOne(
            { email },
            {$set: {
              isAdmin: true,
              }}
        );
        console.log(`Admin seed: user ${email} upgraded to Admin status`)
      }
      else {
        console.log(`Admin seed: user ${email} already exists, skipping`);
        return
      }
    }

    const hashed = await argon2.hash(password);
    const now = new Date().toISOString();
    const doc: Record<string, any> = {
      email,
      username,
      password: hashed,
      createdAt: now,
      isAdmin: true,
      name: displayName,
    };

    await users.insertOne(doc);
    console.log(`Admin seed: created adin user ${email}`);
  } catch (err) {
    console.error("Admin seed failed:", err);
  }
}
