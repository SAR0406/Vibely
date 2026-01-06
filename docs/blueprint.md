# **App Name**: Vibely

## Core Features:

- Real-time Messaging: Instant send/receive of text messages with optimistic updates, smooth scroll, and batching for performance.
- User Authentication: Secure sign-up/login (email + OAuth providers), session persistence, profile (name/avatar).
- Channel Creation: Users create public/private channels. An LLM-powered Channel Assistant analyzes title + member list to suggest topic, description, and automations (welcome messages, scheduled event invites, ice-breakers).
- Shadcn UI Integration: Use Shadcn components (Radix + Tailwind) for accessible, polished UI.
- Emoji Support: Full emoji picker + native emoji rendering; support for Unicode and shortcodes.
- Message Read State: Sent / Delivered / Read indicators (single/double checkmarks), seen-by list for groups.
- Typing Indicators & Presence: Live typing indicators and online/offline presence.
- Message Search & Mentions: Fast search and @mentions with highlights.
- Attachments (optional): Images/files via secure storage (S3 / Supabase Storage) with previews.
- LLM Automation Playground: UI for channel owners to enable/adjust suggested automations.

## Style Guidelines:

- Primary color: Lavender (#E6E6FA) for a soothing and elegant feel.
- Background color: Seashell (#FFF5EE) to create a soft and welcoming atmosphere.
- Accent color: Deep Rose (#D81E5B) for interactive elements and luxurious highlights.
- Headline font: 'Lora' serif font for an elegant and refined statement.
- Body font: 'Nunito Sans' sans-serif for readability and modernity.
- Use Phosphor Icons or Remix Icon — minimalist, 2-tone with a subtle rose accent for interactive states.
- Edge & Spacing: 12px base spacing, 8px micro spacing, 20px comfy spacing.
- Message UI: Rounded 12px bubbles, subtle shadow, distinct colors for self vs others, timestamp and sender metadata visible on each bubble.
- Animations: Subtle fade + translate micro-animations using Framer Motion. Avoid long or distracting animations.
- Accessibility: WCAG AA color contrast; keyboard navigation; ARIA labels for interactive elements.