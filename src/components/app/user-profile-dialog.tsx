'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';
import { User } from '@/lib/types';
import { MessageSquarePlus } from 'lucide-react';

type UserProfileDialogProps = {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartChat: (user: User) => void;
};

export function UserProfileDialog({
  user,
  isOpen,
  onOpenChange,
  onStartChat,
}: UserProfileDialogProps) {
  if (!user) {
    return null;
  }

  const handleStartChatClick = () => {
    onStartChat(user);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader className="items-center text-center">
          <UserAvatar
            src={user.avatarUrl}
            name={user.fullName || 'User'}
            isOnline={user.online}
            className="size-24"
          />
          <DialogTitle className="font-headline text-2xl pt-4">
            {user.fullName}
          </DialogTitle>
          <DialogDescription>{user.userCode}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleStartChatClick} className="w-full">
            <MessageSquarePlus className="mr-2 size-4" />
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
