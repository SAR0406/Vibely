import type { User, Channel, Message } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getUserAvatar = (id: string) => 
  PlaceHolderImages.find(img => img.id === id)?.imageUrl || 'https://picsum.photos/seed/placeholder/100/100';

// This data is now primarily for fallback or initial structure reference.
// The app should rely on Firestore for live data.

export const users: User[] = [
  { id: 'user-1', name: 'Amelia', fullName: 'Amelia', avatarUrl: getUserAvatar('user-1'), online: true },
  { id: 'user-2', name: 'Ben', fullName: 'Ben', avatarUrl: getUserAvatar('user-2'), online: true },
  { id: 'user-3', name: 'Clara', fullName: 'Clara', avatarUrl: getUserAvatar('user-3'), online: false },
  { id: 'user-4', name: 'David', fullName: 'David', avatarUrl: getUserAvatar('user-4'), online: true },
  { id: 'user-5', name: 'You', fullName: 'You', avatarUrl: getUserAvatar('user-5'), online: true },
  { id: 'user-6', name: 'Emily', fullName: 'Emily', avatarUrl: getUserAvatar('user-6'), online: false },
  { id: 'user-7', name: 'Frank', fullName: 'Frank', avatarUrl: getUserAvatar('user-7'), online: true },
];

export const channels: Channel[] = [
  {
    id: 'channel-1',
    name: 'Product Team',
    description: 'Discussions about our next big feature.',
    members: ['user-1', 'user-2', 'user-5'],
    isPublic: true,
    isDM: false,
    ownerId: 'user-5',
    automations: [
      { id: 'auto-1', name: 'Welcome Message', description: 'Sends a welcome message to new members.', enabled: true, content: 'Welcome to the Product Team channel, {{user}}!' },
      { id: 'auto-2', name: 'Scheduled Event Invite', description: 'Sends invites for scheduled events.', enabled: false, content: 'Reminder: Weekly sync tomorrow at 10 AM.' },
    ],
  },
  {
    id: 'channel-2',
    name: 'Random',
    description: 'A place for fun and random thoughts.',
    members: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7'],
    isPublic: true,
    isDM: false,
    ownerId: 'user-1',
    automations: [
       { id: 'auto-3', name: 'Ice Breaker', description: 'Prompts users with an ice breaker question.', enabled: true, content: "What's the most interesting thing you've read this week?" },
    ],
  },
];

export const messages: Message[] = [
  {
    id: 'msg-1',
    channelId: 'channel-1',
    authorId: 'user-1',
    content: 'Hey everyone, let\'s brainstorm ideas for the Q3 roadmap. 🧠',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    readStatus: 'read',
  },
  {
    id: 'msg-2',
    channelId: 'channel-1',
    authorId: 'user-2',
    content: 'Great idea! I was thinking we could focus on improving user onboarding. What do you think?',
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    readStatus: 'read',
  },
  {
    id: 'msg-3',
    channelId: 'channel-1',
    authorId: 'user-5',
    content: 'Onboarding is a solid plan. I can put together some mockups for a new flow. I\'ll have them ready by EOD.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    readStatus: 'delivered',
  },
];
