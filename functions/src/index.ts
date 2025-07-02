import {setGlobalOptions} from "firebase-functions/v2";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// --- ADD THESE TWO LINES ---
import * as admin from "firebase-admin";
admin.initializeApp();
// -------------------------

// Set global options for all functions
setGlobalOptions({maxInstances: 10});

// Define the onboardnewuser function
export const onboardnewuser = onRequest(
  {cors: true},
  async (request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    logger.info("onboardnewuser function triggered", {structuredData: true});

    try {
      const user = request.body.data;

      if (!user || !user.uid || !user.email) {
        logger.error("Missing user object or uid/email in request body.data");
        response.status(400).send({error: "Invalid user data provided."});
        return;
      }
      
      await admin.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Successfully created user document for ${user.uid}`);
      response.status(200).send({message: `User ${user.uid} created.`});

    } catch (error) {
      logger.error("Error creating user document:", error);
      response.status(500).send({error: "Internal Server Error"});
    }
  });

// You can add other functions here in the future, like your generateinvitecode function
