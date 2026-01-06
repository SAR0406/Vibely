'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  src?: string;
  name: string;
  isOnline?: boolean;
  className?: string;
};

export function UserAvatar({
  src,
  name,
  isOnline,
  className,
}: UserAvatarProps) {
  const fallback = name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className="size-8">
        <AvatarImage asChild src={src}>
          {src && (
            <Image
              src={src}
              alt={name}
              width={32}
              height={32}
              className="object-cover"
              data-ai-hint="user avatar"
            />
          )}
        </AvatarImage>
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {isOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
      )}
    </div>
  );
}
