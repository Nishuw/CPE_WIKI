const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK only once
try {
  admin.initializeApp();
} catch (e) {
  functions.logger.info("Admin SDK already initialized or initialization failed", e);
}

const db = admin.firestore();
const MASTER_EMAIL = "admin@admin.com"; // Consider if this is still needed or if claims handle it

// Helper function to check if the caller is an admin
const checkAdmin = async (context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const callerUid = context.auth.uid;
  // Get the user record to check custom claims.
  const userRecord = await admin.auth().getUser(callerUid);
  // Check if the user has the 'admin' custom claim set to true.
  if (!userRecord.customClaims || !userRecord.customClaims.admin) {
    throw new functions.https.HttpsError('permission-denied', 'The function must be called by an admin.');
  }
  // Log admin access for auditing.
  functions.logger.info(`Admin check passed for user: ${context.auth.token.email} (UID: ${callerUid})`);
};


/**
 * Triggered when a new user is created in Firebase Authentication.
 * Creates a corresponding user document in Firestore.
 */
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  functions.logger.info(`New user created: ${email} (UID: ${uid})`);

  // Automatically grant admin claim to the MASTER_EMAIL upon creation.
  // Note: This only happens *at creation*. Use setAdminClaim function or setAdminClaim.js script for existing users.
  if (email === MASTER_EMAIL) {
    functions.logger.info(`Attempting to set admin claim for master admin: ${email}`);
     try {
       await admin.auth().setCustomUserClaims(uid, { admin: true });
       functions.logger.info(`Successfully set custom claim 'admin: true' for master admin ${email}`);
       // No need to create a Firestore doc for the master admin if they are purely for admin tasks
       // return null; // Uncomment if you don't want a Firestore doc for the master admin
     } catch (claimError) {
       functions.logger.error(`Error setting custom claim for master admin ${email}:`, claimError);
       // Proceed to create Firestore doc even if claim setting fails? Or handle differently?
     }
     // If you decide not to have a Firestore doc for the master admin, uncomment the 'return null;' above.
     // Otherwise, let it fall through to create the doc like any other user.
  }

  const userRef = db.collection("users").doc(uid);

  try {
    await userRef.set({
      uid: uid,
      email: email || "", // Ensure email is not undefined
      displayName: displayName || email || "", // Fallback display name to email if needed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Initialize roles or other fields if necessary
      // roles: email === MASTER_EMAIL ? ['admin'] : ['user'] // Example if using Firestore roles alongside claims
    }, { merge: true }); // Use merge: true to avoid overwriting data

    functions.logger.info(`Successfully created Firestore document for user: ${email}`);
    return null;
  } catch (error) {
    functions.logger.error(`Error creating Firestore document for user ${email} (UID: ${uid}):`, error);
    return null;
  }
});

/**
 * Triggered when a user is deleted from Firebase Authentication.
 * Deletes the corresponding user document from Firestore.
 */
exports.deleteUserDocument = functions.auth.user().onDelete(async (user) => {
  const { uid, email } = user;
  functions.logger.info(`Firebase Auth user deleted: ${email} (UID: ${uid}). Attempting to delete Firestore doc.`);

  const userRef = db.collection("users").doc(uid);

  try {
    await userRef.delete();
    functions.logger.info(`Successfully deleted Firestore document for user: ${email}`);
    return null;
  } catch (error) {
    functions.logger.error(`Error deleting Firestore document for user ${email} (UID: ${uid}):`, error);
    if (error.code === 5) { // Code 5 is NOT_FOUND
        functions.logger.warn(`Firestore document for user ${email} not found. Might have been deleted already or never existed.`);
    }
    // Don't re-throw error, as the Auth user is already gone.
    return null;
  }
});

// --- NEW CALLABLE FUNCTIONS ---

/**
 * Callable function to list all Firebase Auth users.
 * Requires admin privileges.
 */
exports.listAuthUsers = functions.https.onCall(async (data, context) => {
  await checkAdmin(context); // Ensure caller is admin

  const maxResults = 1000; // Max users per page (adjust if needed, max 1000)
  let users = [];
  let nextPageToken;

  functions.logger.info(`Admin ${context.auth.token.email} requesting user list.`);

  try {
    do {
      const listUsersResult = await admin.auth().listUsers(maxResults, nextPageToken);
      listUsersResult.users.forEach((userRecord) => {
        // Send back only necessary info to the client
        users.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          customClaims: userRecord.customClaims || {}, // Ensure claims object exists
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
          },
        });
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    functions.logger.info(`Admin ${context.auth.token.email} successfully listed ${users.length} users.`);
    return { users: users };
  } catch (error) {
    functions.logger.error(`Error listing users for admin ${context.auth.token.email}:`, error);
    throw new functions.https.HttpsError('internal', 'Unable to list users.', error.message);
  }
});

/**
 * Callable function to set/unset admin claim for a user.
 * Requires admin privileges.
 * Expects data: { targetUid: string, isAdmin: boolean }
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  await checkAdmin(context); // Ensure caller is admin

  const targetUid = data.targetUid;
  const isAdmin = data.isAdmin; // Expecting true or false

  functions.logger.info(`Admin ${context.auth.token.email} requesting to set admin=${isAdmin} for UID: ${targetUid}`);


  if (!targetUid || typeof isAdmin !== 'boolean') {
     throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "targetUid" (string) and "isAdmin" (boolean) argument.');
  }

  // Prevent admin from removing their own admin status via this function
  if (context.auth.uid === targetUid && !isAdmin) {
       functions.logger.warn(`Admin ${context.auth.token.email} attempted to remove their own admin status.`);
       throw new functions.https.HttpsError('permission-denied', 'Admin cannot remove their own admin status via this function. Use Firebase Console or another method if necessary.');
  }

  try {
    // Get current claims to preserve others if they exist
    const targetUserRecord = await admin.auth().getUser(targetUid);
    const currentClaims = targetUserRecord.customClaims || {};

    // Set the new claims, merging with existing ones (overwriting 'admin')
    await admin.auth().setCustomUserClaims(targetUid, { ...currentClaims, admin: isAdmin });

    // Optional: Invalidate existing sessions for the target user so they get the new claim immediately
    // await admin.auth().revokeRefreshTokens(targetUid);
    // functions.logger.info(`Revoked refresh tokens for user ${targetUid} after claim change.`);


    functions.logger.info(`Admin ${context.auth.token.email} successfully set admin=${isAdmin} for user ${targetUid}`);
    return { message: `Successfully set admin=${isAdmin} for user ${targetUid}` };
  } catch (error) {
    functions.logger.error(`Error setting admin claim for ${targetUid} by admin ${context.auth.token.email}:`, error);
     if (error.code === 'auth/user-not-found') {
             throw new functions.https.HttpsError('not-found', 'The target user does not exist.');
        }
    throw new functions.https.HttpsError('internal', 'Unable to set custom claim.', error.message);
  }
});

/**
 * Callable function to delete a user from Firebase Authentication.
 * Requires admin privileges.
 * Expects data: { targetUid: string }
 */
exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
    await checkAdmin(context); // Ensure caller is admin

    const targetUid = data.targetUid;
    functions.logger.info(`Admin ${context.auth.token.email} requesting to delete user UID: ${targetUid}`);

    if (!targetUid) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "targetUid" (string) argument.');
    }

    // Prevent admin from deleting themselves
    if (context.auth.uid === targetUid) {
         functions.logger.warn(`Admin ${context.auth.token.email} attempted to delete their own account.`);
        throw new functions.https.HttpsError('permission-denied', 'Admin cannot delete their own account.');
    }

    try {
        await admin.auth().deleteUser(targetUid);
        // The onDelete trigger (deleteUserDocument) should handle deleting the Firestore doc automatically.
        functions.logger.info(`Admin ${context.auth.token.email} successfully initiated deletion of user ${targetUid}`);
        return { message: `Successfully deleted user ${targetUid}` };
    } catch (error) {
        functions.logger.error(`Error deleting user ${targetUid} by admin ${context.auth.token.email}:`, error);
        if (error.code === 'auth/user-not-found') {
             throw new functions.https.HttpsError('not-found', 'The target user does not exist.');
        }
        throw new functions.https.HttpsError('internal', 'Unable to delete user.', error.message);
    }
});
