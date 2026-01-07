'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '';

  return (
    <TooltipProvider delayDuration={200}>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn('relative inline-block', className)}>
                    <Avatar className="size-8">
                        <AvatarImage asChild src={src}>
                        {src && (
                            <Image
                            src={src}
                            alt={name || 'User avatar'}
                            width={32}
                            height={32}
                            className="object-cover"
                            />
                        )}
                        </AvatarImage>
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    {isOnline !== undefined && (
                        <span className={cn(
                            "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{name}</p>
                <p className="text-sm text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
