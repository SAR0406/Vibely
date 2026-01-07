import { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  name: string; // This will be the displayName
  avatarUrl: string;
  online: boolean;
  // Fields from firestore
  fullName?: string;
  username?: string;
  email?: string;
  lastSeen?: any; // Can be a server timestamp or a Date object
};

export type Message = {
  id: string;
  channelId?: string; // Made optional as it's part of the subcollection path
  authorId: string;
  content: string;
  timestamp: any; // Can be a server timestamp or a Date object
  readStatus: 'read' | null;
};

export type Channel = {
  id: string;
  name: string;
  description: string;
  members: string[];
  isPublic: boolean;
  isDM: boolean;
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
