import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function addAdminRoleToUser(userId) {
  try {
    const user = await clerk.users.getUser(userId);
    const publicMetadata = user.publicMetadata || {};
    const roles = publicMetadata.roles || [];

    if (!roles.includes("admin")) {
      roles.push("admin");
    }

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { ...publicMetadata, roles },
    });

    console.log(`✅ Updated roles for user ${userId}`);
  } catch (error) {
    console.error("❌ Error updating user roles:", error);
  }
}

export default clerk;