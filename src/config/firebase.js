const admin = require("firebase-admin");
const path = require("path");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
  try {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf8");
    serviceAccount = JSON.parse(json);
  } catch (err) {
    console.error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", err.message);
    throw err;
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (err) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY is present but not valid JSON:", err.message);
    throw err;
  }
} else {
  try {
    serviceAccount = require(path.resolve(__dirname, "../../serviceAccountKey.json"));
  } catch (err) {
    console.error("No Firebase service account provided. Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 or FIREBASE_SERVICE_ACCOUNT_KEY.");
    throw err;
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
