// C:\Users\scorp\projects\metiscore-backend\functions\src\index.ts

import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// ============================================================================
//  ONBOARD NEW USER FUNCTION
// ============================================================================
export const onboardnewuser = onRequest(
  { cors: true },
  async (request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }
    logger.info("onboardnewuser function triggered");
    try {
      const user = request.body.data;
      if (!user || !user.uid || !user.email) {
        logger.error("Invalid user data provided.", { body: request.body });
        response.status(400).send({ error: "Invalid user data provided." });
        return;
      }
      const userRef = admin.firestore().collection("users").doc(user.uid);
      await userRef.set({
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      logger.info(`Successfully created/merged user document for ${user.uid}`);
      response.status(200).send({ message: `User ${user.uid} processed.` });
    } catch (error) {
      logger.error("Error in onboardnewuser function:", error);
      response.status(500).send({ error: "Internal Server Error" });
    }
  });

// ============================================================================
//  ACCEPT PARTNER INVITE FUNCTION (This is the one we need to deploy)
// ============================================================================
export const acceptPartnerInvite = onRequest(
  { cors: true },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).send('Method Not Allowed');
      return;
    }
    const { inviteCode, partnerUid } = request.body;
    if (!inviteCode || !partnerUid) {
      logger.error("Missing inviteCode or partnerUid", { body: request.body });
      response.status(400).send({ error: "Invite code and partner UID are required." });
      return;
    }
    const db = admin.firestore();
    const inviteRef = db.collection("invites").doc(inviteCode);
    const partnerUserRef = db.collection("users").doc(partnerUid);
    try {
      const result = await db.runTransaction(async (transaction) => {
        const inviteDoc = await transaction.get(inviteRef);
        if (!inviteDoc.exists) {
          throw new Error("Invalid invite code. Please check the code and try again.");
        }
        const inviteData = inviteDoc.data()!;
        if (inviteData.status !== "pending") {
          throw new Error("This invite has already been used or has expired.");
        }
        if (inviteData.expiresAt.toDate() < new Date()) {
           transaction.update(inviteRef, { status: 'expired' });
           throw new Error("This invite code has expired.");
        }
        const primaryUserId = inviteData.fromUserId;
        const primaryUserRef = db.collection("users").doc(primaryUserId);
        transaction.update(primaryUserRef, { partnerId: partnerUid });
        transaction.update(partnerUserRef, { partnerId: primaryUserId });
        transaction.update(inviteRef, {
          status: 'completed',
          acceptedBy: partnerUid,
          acceptedAt: FieldValue.serverTimestamp()
        });
        return { success: true, message: "Successfully linked accounts!" };
      });
      logger.info(`Invite ${inviteCode} successfully accepted by ${partnerUid}`);
      response.status(200).send(result);
    } catch (error: any) {
      logger.error(`Failed to accept invite ${inviteCode}:`, error);
      response.status(500).send({ error: error.message || "An internal error occurred." });
    }
  }
);
