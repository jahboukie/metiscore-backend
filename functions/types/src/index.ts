export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'primary' | 'partner' | 'provider'; // Expanded for future use
  partnerId?: string | null; // The UID of the linked partner/primary user
  // We can add more fields here later for Dr. Alex AI, like 'authorizedPatientIds'
}

export interface JournalEntry {
  id: string; // The Firestore document ID
  userId: string; // The UID of the user who wrote it
  createdAt: Date;
  text: string; // The raw text for analysis (might be handled ephemerally)
  analysis: Record<string, any>; // The structured JSON from the sentiment service
  isShared: boolean;
  appOrigin: string; // e.g., 'MenoWellness', 'SoberPal', etc.
}

export interface Invite {
  id: string; // The Firestore document ID
  fromUserId: string; // UID of the user who sent the invite
  toEmail: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}
