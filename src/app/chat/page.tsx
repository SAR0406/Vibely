'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import ChatLayout from '@/components/app/chat-layout';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

function ChatPageContent() {
  const { user, isUserLoading, userError } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user && firestore) {
      const userStatusRef = doc(firestore, 'users', user.uid);
      updateDoc(userStatusRef, {
        online: true,
      });

      const handleBeforeUnload = () => {
        updateDoc(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updateDoc(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      };
    }
  }, [user, firestore]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-destructive">
          Something went wrong. Please try refreshing.
        </p>
      </div>
    );
  }

  if (user) {
    return <ChatLayout />;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
