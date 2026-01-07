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
import { User, ChatRequest } from '@/lib/types';
import { MessageSquarePlus } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type UserProfileDialogProps = {
  user: User | null;
  currentUser: User | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartChat: (user: User) => void;
};

export function UserProfileDialog({
  user,
  currentUser,
  isOpen,
  onOpenChange,
  onStartChat,
}: UserProfileDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

  if (!user || !currentUser) {
    return null;
  }
  
  const isViewingOwnProfile = user.id === currentUser.id;

  const handleSendChatRequest = () => {
    if (!firestore || !currentUser) return;

    // A unique ID for the request based on sender and receiver
    const requestId = `req_${currentUser.id}_${user.id}`;
    // The request will be stored in the *recipient's* subcollection
    const requestRef = doc(firestore, 'users', user.id, 'chatRequests', requestId);
    
    const requestData: Omit<ChatRequest, 'id'> = {
        fromUserId: currentUser.id,
        fromUserCode: currentUser.userCode!,
        fromFullName: currentUser.fullName!,
        fromAvatarUrl: currentUser.avatarUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
    };

    setDocumentNonBlocking(requestRef, requestData, { merge: false });
    
    toast({
        title: "Request Sent!",
        description: `Your chat request has been sent to ${user.fullName}.`,
    });
    
    onOpenChange(false);
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
        {!isViewingOwnProfile && (
            <DialogFooter>
            <Button onClick={handleSendChatRequest} className="w-full">
                <MessageSquarePlus className="mr-2 size-4" />
                Send Chat Request
            </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
