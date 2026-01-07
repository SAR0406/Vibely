'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronsRight, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  getAdditionalUserInfo,
  updateProfile,
} from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '@/components/ui/separator';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    {...props}
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);


const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string().min(3, { message: "Username must be at least 3 characters."}),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const googleSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
});


export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isGoogleStep2, setIsGoogleStep2] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', username: '', email: '', password: '' },
  });

  const googleForm = useForm<z.infer<typeof googleSchema>>({
    resolver: zodResolver(googleSchema),
    defaultValues: { name: '', username: '' },
  });


  useEffect(() => {
    // If we are in the second step of Google signup and the user refreshes or navigates away,
    // they should be logged out to avoid being in a weird state.
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGoogleStep2) {
        auth.signOut();
      }
    };
  
    if (isGoogleStep2) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGoogleStep2, auth]);

  useEffect(() => {
    // Redirect authenticated users (who are not in the middle of Google signup) to chat
    if (!isUserLoading && user && !isGoogleStep2) {
      router.push('/chat');
    }
  }, [user, isUserLoading, router, isGoogleStep2]);

  // When a user signs in with Google, pre-fill the second form with their display name
  useEffect(() => {
    if(isGoogleStep2 && user) {
        googleForm.setValue('name', user.displayName || '');
        googleForm.setValue('username', user.email?.split('@')[0] || '');
    }
  }, [isGoogleStep2, user, googleForm]);


  const createFirestoreUser = (
    uid: string,
    email: string,
    fullName: string,
    username: string,
    avatarUrl?: string | null
  ) => {
    const userDocRef = doc(firestore, 'users', uid);
    const userDirRef = doc(firestore, 'userDirectory', uid);
    const randomAvatar =
      PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)]
        .imageUrl;
    
    const finalAvatarUrl = avatarUrl || randomAvatar;
    
    // Generate a unique user code
    const userCode = `${username}#${Math.floor(1000 + Math.random() * 9000)}`;

    // Create user profile
    setDocumentNonBlocking(
      userDocRef,
      {
        id: uid,
        email,
        fullName,
        username,
        userCode,
        avatarUrl: finalAvatarUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
      
    // Create user directory entry for search
    setDocumentNonBlocking(
      userDirRef,
      {
        id: uid,
        userCode,
        fullName,
        avatarUrl: finalAvatarUrl,
      },
      { merge: false } // Use merge: false for new doc
    );
  };

  const handleEmailSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const newUser = userCredential.user;
      await updateProfile(newUser, { displayName: values.name });
      createFirestoreUser(
        newUser.uid,
        values.email,
        values.name,
        values.username
      );
      // The onAuthStateChanged listener will handle redirecting to /chat
    } catch (error) {
      handleAuthError(error);
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (providerName: 'google' | 'github') => {
    setSocialLoading(providerName);
    const provider =
      providerName === 'google'
        ? new GoogleAuthProvider()
        : new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
      const socialUser = result.user;

      if (providerName === 'google' && isNewUser) {
        // This is a new Google user, show step 2 to collect more info
        setIsGoogleStep2(true);
        setSocialLoading(null); // Stop loading indicator
        return; // Stop execution, wait for user to fill out the next form
      }
      
      // For GitHub or returning Google users, create their profile immediately
      if(isNewUser) {
        const username = socialUser.displayName?.replace(/\s+/g, '').toLowerCase() || socialUser.email!.split('@')[0];
        createFirestoreUser(
          socialUser.uid,
          socialUser.email!,
          socialUser.displayName || socialUser.email!.split('@')[0],
          username,
          socialUser.photoURL
        );
      }
      // Auth listener will redirect to /chat
    } catch (error) {
      handleAuthError(error);
      setSocialLoading(null);
    }
  };

  const handleGoogleStep2Submit = async (values: z.infer<typeof googleSchema>) => {
    setIsLoading(true);
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No authenticated user found. Please try signing in again.',
        });
        setIsLoading(false);
        setIsGoogleStep2(false);
        return;
    }
    
    try {
        await updateProfile(user, { displayName: values.name });
        createFirestoreUser(
            user.uid,
            user.email!,
            values.name,
            values.username,
            user.photoURL
        );
        // At this point, the user is fully signed up. We can clear the state.
        setIsGoogleStep2(false); 
        // The main useEffect will now redirect to /chat
    } catch(error) {
        handleAuthError(error);
        setIsLoading(false);
    }
  }

  const handleAuthError = (error: any) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage =
            'This email is already registered. Please try logging in.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Your password is too weak. Please choose a stronger one.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage =
            'An account already exists with this email. Please sign in with the original method.';
          break;
        default:
          errorMessage = 'Sign up failed. Please try again later.';
          break;
      }
    }
    toast({
      variant: 'destructive',
      title: 'Sign Up Failed',
      description: errorMessage,
    });
  };

  if (isUserLoading || (user && !isGoogleStep2)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Link href="/" className="flex items-center gap-2">
                <ChevronsRight className="h-10 w-10 text-primary" />
              </Link>
            </div>
            <CardTitle className="font-headline text-3xl">
              {isGoogleStep2 ? 'Almost there...' : 'Create an Account'}
            </CardTitle>
            <CardDescription>
              {isGoogleStep2 ? 'Just a few more details and you\'re all set.' : 'Enter your information to get started with Vibely.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGoogleStep2 ? (
                <Form {...googleForm}>
                    <form onSubmit={googleForm.handleSubmit(handleGoogleStep2Submit)} className="space-y-4">
                         <FormField
                            control={googleForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your Name" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={googleForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. janedoe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Complete Sign Up
                        </Button>
                    </form>
                </Form>
            ) : (
                <>
                <Form {...signupForm}>
                    <form
                    onSubmit={signupForm.handleSubmit(handleEmailSignup)}
                    className="space-y-4"
                    >
                    <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                            <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={signupForm.control}
                        name="username"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. janedoe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Account
                    </Button>
                    </form>
                </Form>

                <div className="relative my-6">
                    <Separator />
                    <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                    </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => handleSocialSignup('github')} disabled={!!socialLoading}>
                    {socialLoading === 'github' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GithubIcon className="mr-2 h-4 w-4" />}
                    GitHub
                  </Button>
                  <Button variant="outline" onClick={() => handleSocialSignup('google')} disabled={!!socialLoading}>
                     {socialLoading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                    Google
                  </Button>
                </div>

                <div className="mt-4 text-center text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="underline">
                    Login
                    </Link>
                </div>
                </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
