import axios from "axios";
import jwt from "jsonwebtoken";

const projectId = process.env.FIREBASE_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");

// get OAuth2 access token
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });

  const res = await axios.post("https://oauth2.googleapis.com/token", {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: token,
  });

  return res.data.access_token;
}

// get all tokens from Firestore
async function getAllFcmTokens(accessToken: string): Promise<string[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/fcm_tokens`;

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.data.documents) return [];

  return res.data.documents.map((doc: any) => doc.fields.token.stringValue);
}

// send a single push
async function sendSingle(accessToken: string, token: string, title: string, body: string) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message = {
    message: {
      token,
      notification: { title, body },
    },
  };

  await axios.post(url, message, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

// public function
export async function sendNotification(title: string, body: string) {
  const accessToken = await getAccessToken();
  const tokens = await getAllFcmTokens(accessToken);

  if (tokens.length === 0) {
    console.log("⚠️ No FCM tokens found");
    return;
  }

  console.log(`📨 Sending to ${tokens.length} devices...`);

  await Promise.allSettled(
    tokens.map(t => sendSingle(accessToken, t, title, body))
  );

  console.log("✅ Notifications sent!");
}
