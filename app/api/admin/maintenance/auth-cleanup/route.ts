import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { requireAdminSession } from "@/lib/auth/admin";

export async function POST() {
  try {
    // 1. Ensure the user is an admin
    await requireAdminSession();
    
    const auth = getFirebaseAdminAuth();
    const now = Date.now();
    const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000); // 48 hours in ms
    
    let totalUsers = 0;
    let deletedCount = 0;
    let nextPageToken: string | undefined;

    // We process in batches of 1000 (Firebase default limit)
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      totalUsers += listUsersResult.users.length;
      
      const unverifiedUsers = listUsersResult.users.filter(user => {
        const creationTime = new Date(user.metadata.creationTime).getTime();
        return !user.emailVerified && creationTime < fortyEightHoursAgo;
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

    return NextResponse.json({
      message: `Successfully cleaned up ${deletedCount} unverified users.`,
      deletedCount,
      scannedCount: totalUsers
    });
  } catch (error) {
    console.error("[auth-cleanup] unexpected error", error);
    return NextResponse.json(
      { error: "cleanup_failed", message: error instanceof Error ? error.message : "Internal server error during cleanup." },
      { status: 500 }
    );
  }
}
