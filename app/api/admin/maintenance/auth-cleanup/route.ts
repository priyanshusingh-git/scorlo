import { jsonNoStore } from "@/lib/api-response";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getCurrentAdminSessionUser, isMainAdminUser } from "@/lib/auth/admin";

export async function POST() {
  try {
    const admin = await getCurrentAdminSessionUser();
    if (!admin) {
      return jsonNoStore({ error: "unauthorized", message: "Admin session required." }, { status: 401 });
    }
    if (!isMainAdminUser(admin)) {
      return jsonNoStore(
        { error: "forbidden", message: "Only the main admin can access maintenance." },
        { status: 403 }
      );
    }
    
    const auth = getFirebaseAdminAuth();
    const now = Date.now();
    const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000); // 48 hours in ms
    
    let totalUsers = 0;
    let deletedCount = 0;
    let nextPageToken: string | undefined;

    // Process in batches of 1000
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      totalUsers += listUsersResult.users.length;
      
      const unverifiedUsers = listUsersResult.users.filter(user => {
        const email = user.email?.toLowerCase() || "";
        const creationTime = new Date(user.metadata.creationTime).getTime();
        
        // --- SAFEGUARD: MAKE @scorlo.in COMPLETELY IMMUNE ---
        // Any other unverified email (even random domains) is eligible for purge.
        if (email.endsWith("@scorlo.in")) return false;
        
        // --- SAFEGUARD: NEVER DELETE VERIFIED USERS ---
        if (user.emailVerified) return false;
        
        // --- SAFEGUARD: 48H BUFFER ---
        // Only delete accounts that were created more than 48 hours ago.
        if (creationTime >= fortyEightHoursAgo) return false;

        return true;
      });

      if (unverifiedUsers.length > 0) {
        const uidsToDelete = unverifiedUsers.map(u => u.uid);
        const deleteResult = await auth.deleteUsers(uidsToDelete);
        deletedCount += deleteResult.successCount;
        
        if (deleteResult.failureCount > 0) {
          console.error(`[auth-cleanup] Failed to delete ${deleteResult.failureCount} users`, deleteResult.errors);
        }
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.info(`[auth-cleanup] Completed. Scanned: ${totalUsers}, Deleted: ${deletedCount}`);

    return jsonNoStore({
      message: `Successfully purged ${deletedCount} unverified student accounts.`,
      deletedCount,
      scannedCount: totalUsers
    });
  } catch (error) {
    console.error("[auth-cleanup] error", error);
    return jsonNoStore(
      { error: "cleanup_failed", message: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 }
    );
  }
}
