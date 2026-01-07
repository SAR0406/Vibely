'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/app/user-avatar';

const companionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  persona: z.string().min(10, 'Persona description is too short.').max(500, 'Persona description is too long.'),
  voice: z.string().min(1, 'Please select a voice.'),
  avatarUrl: z.string().url('Please provide a valid URL for the avatar.').optional().or(z.literal('')),
});

const voices = ['Algenib', 'Achernar', 'Enif', 'Hadar', 'Regulus', 'Sirius'];

export default function NewCompanionPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof companionSchema>>({
    resolver: zodResolver(companionSchema),
    defaultValues: {
      name: '',
      persona: '',
      voice: '',
      avatarUrl: '',
    },
  });

  const avatarUrl = form.watch('avatarUrl');

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const onSubmit = async (values: z.infer<typeof companionSchema>) => {
    setIsLoading(true);
    if (!firestore) return;
    
    try {
        const companionRef = doc(collection(firestore, 'companions'));
        const companionId = companionRef.id;

        await setDocumentNonBlocking(companionRef, {
            id: companionId,
            ownerId: user.uid,
            tools: ['web_search'],
            createdAt: new Date().toISOString(),
            ...values,
        }, { merge: false });

        toast({
            title: 'Companion Created!',
            description: `${values.name} is ready to join your chats.`,
        });

        router.push('/companion');
    } catch (error) {
        console.error("Failed to create companion:", error);
        toast({
            variant: 'destructive',
            title: 'Uh oh!',
            description: 'Something went wrong while creating your companion.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create New AI Companion</CardTitle>
          <CardDescription>Design a unique AI personality to join your chats.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex items-center gap-6">
                <UserAvatar src={avatarUrl} name={form.watch('name') || '?'} className="size-24" />
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/avatar.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Astro, the Space Expert" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="persona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your companion's personality and purpose. For example: 'You are a witty historian who loves to share fun facts about the Roman Empire.'"
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voice</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a voice for your companion" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {voices.map(voice => (
                          <SelectItem key={voice} value={voice}>{voice}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create Companion
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
