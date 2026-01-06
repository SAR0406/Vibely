export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  online: boolean;
  // Fields from firestore
  fullName?: string;
  username?: string;
  email?: string;
};

export type Message = {
  id: string;
  channelId?: string; // Made optional as it's part of the subcollection path
  authorId: string;
  content: string;
  timestamp: string;
  readStatus: 'sent' | 'delivered' | 'read' | null;
};

export type Channel = {
  id: string;
  name: string;
  description: string;
  members: string[];
  type: 'public' | 'private';
  ownerId: string;
  automations: Automation[];
};

export type Automation = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  content: string;
};
