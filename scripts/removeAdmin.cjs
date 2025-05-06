// removeAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

const removeAdminClaim = async (uid) => {
  try {
    // Remove the 'admin' custom claim
    await auth.setCustomUserClaims(uid, {}); // Setting claims to {} clears all claims
    console.log(`Custom claims for user ${uid} have been cleared.`);

    // Update the isAdmin field in Firestore
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({ isAdmin: false });
    console.log(`isAdmin field for user ${uid} in Firestore has been set to false.`);

    console.log(`Admin privileges successfully removed for user ${uid}.`);
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    if (error.code === 'auth/user-not-found') {
        console.error(`User with UID ${uid} not found.`);
    } else if (error.code === 'firestore/not-found') {
        console.error(`User document with UID ${uid} not found in Firestore.`);
    }
  }
};

// Get UID from command line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: node removeAdmin.js <user-uid>');
  process.exit(1);
}

const userUid = args[0];
removeAdminClaim(userUid);