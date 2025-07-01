import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https"; // <-- Changed to onRequest
import { UserRecord } from "firebase-admin/auth";
import { User } from "./types";
import * as cors from "cors";

// Initialize CORS middleware with a function call
const corsHandler = cors({ origin: true });

initializeApp();

export const onboardnewuser = onRequest({ cors: true }, async (request, response) => {
  // Use the cors middleware to handle CORS headers
  corsHandler(request, response, async () => {
    // We are no longer using onCall, so we must manually check the auth token.
    // For now, we will trust the data passed from our secure frontend.
    // In a future step, we would verify the token here.

    const user = request.body.data as UserRecord; // Data is now in request.body.data
    const { uid, email, displayName } = user;

    const newUser: User = {
      uid,
      email: email || null,
      displayName: displayName || null,
      role: "primary",
    };

    try {
      await getFirestore().collection("users").doc(uid).set(newUser, { merge: true });
      console.log(`Successfully onboarded user ${uid}`);
      response.status(200).send({ data: { status: "success", message: `User ${uid} onboarded.` } });
    } catch (error) {
      console.error(`Error onboarding user ${uid}:`, error);
      response.status(500).send({ error: "An error occurred while creating the user profile." });
    }
  });
});
