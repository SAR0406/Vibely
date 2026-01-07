'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, query, where, writeBatch } from 'firebase/firestore';
import type { ChatRequest, User } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Check, X } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type ChatRequestsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartChat: (user: User) => void;
};

export function ChatRequestsDialog({
  isOpen,
  onOpenChange,
  onStartChat,
}: ChatRequestsDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const requestsQuery = query(
    collection(firestore, `users/${user?.uid}/chatRequests`),
    where('status', '==', 'pending')
  );
  
  const { data: requests, isLoading } = useCollection<ChatRequest>(requestsQuery);

  const handleRequest = async (request: ChatRequest, newStatus: 'accepted' | 'declined') => {
    if (!user) return;
    
    const requestRef = doc(firestore, `users/${user.uid}/chatRequests`, request.id);
    updateDocumentNonBlocking(requestRef, { status: newStatus });
    
    if (newStatus === 'accepted') {
        // Here we need the full user object of the requester.
        // For simplicity, we'll construct a partial one.
        // A better approach would be to fetch the user document.
        const requester: User = {
            id: request.fromUserId,
            name: request.fromFullName,
            fullName: request.fromFullName,
            userCode: request.fromUserCode,
            avatarUrl: request.fromAvatarUrl,
            online: false, // We don't know this, but it's not critical for starting chat
        };
        onStartChat(requester);
    }

    toast({
        title: `Request ${newStatus}`,
        description: `You have ${newStatus} the chat request from ${request.fromFullName}.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Chat Requests</DialogTitle>
          <DialogDescription>
            Accept or decline requests to start a new private conversation.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-80">
          <div className="p-1">
            {isLoading && (
              <div className="flex justify-center p-8">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
            {!isLoading && (!requests || requests.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No pending chat requests.
              </p>
            )}
            <div className="space-y-2">
              {requests?.map((request) => (
                <div key={request.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={request.fromAvatarUrl}
                      name={request.fromFullName}
                    />
                    <div>
                      <p className="font-semibold">{request.fromFullName}</p>
                      <p className="text-sm text-muted-foreground">{request.fromUserCode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="text-green-500" onClick={() => handleRequest(request, 'accepted')}>
                      <Check className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500" onClick={() => handleRequest(request, 'declined')}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
