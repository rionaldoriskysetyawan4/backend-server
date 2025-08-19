// src/config/firebase.js
const admin = require("firebase-admin");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
  try {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf8");
    serviceAccount = JSON.parse(json);
  } catch (err) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is present but invalid JSON:", err.message);
    throw err;
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (err) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_KEY is present but invalid JSON:", err.message);
    throw err;
  }
} else {
  console.error(
    "FATAL: No Firebase service account provided.\n" +
    "Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 (preferred) or FIREBASE_SERVICE_ACCOUNT_KEY env var."
  );
  throw new Error("Missing Firebase service account env var");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase admin initialized");
module.exports = admin;
