// This file DEFINES the shapes of our data.

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'primary' | 'partner' | 'provider';
  partnerId?: string | null;
}

export interface JournalEntry {
  id: string;
  userId: string;
  createdAt: Date;
  text: string;
  analysis: Record<string, any>;
  isShared: boolean;
  appOrigin: string;
}

export interface Invite {
  id: string;
  fromUserId: string;
  toEmail: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}
