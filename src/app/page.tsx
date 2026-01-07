import Link from 'next/link';
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  Zap,
  Users,
  Palette,
  ChevronsRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { UserAvatar } from '@/components/app/user-avatar';

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="rounded-xl border bg-card/50 p-6 shadow-sm transition-all hover:bg-card hover:shadow-lg">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      {icon}
    </div>
    <h3 className="mb-2 font-headline text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const TestimonialCard = ({
  avatar,
  name,
  title,
  quote,
}: {
  avatar: string;
  name: string;
  title: string;
  quote: string;
}) => (
  <div className="flex h-full flex-col justify-between rounded-xl border bg-card p-6 shadow-sm">
    <div className="mb-4 flex">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <blockquote className="flex-grow text-muted-foreground">
      "{quote}"
    </blockquote>
    <div className="mt-4 flex items-center gap-3">
      <UserAvatar src={avatar} name={name} />
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <ChevronsRight className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl font-bold">Vibely</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Testimonials
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center md:px-6 md:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 inline-block rounded-full border bg-muted px-3 py-1 text-sm text-primary">
              <Sparkles className="mr-2 inline h-4 w-4" />
              Smarter Communication, Seamless Collaboration
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter text-foreground md:text-6xl">
              Elevate Your Team's Communication
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Vibely is the AI-powered messaging platform that organizes your
              conversations, automates your workflows, and brings your team
              closer together.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Request a Demo
              </Button>
            </div>
          </div>
        </section>

        {/* App Screenshot */}
        <section className="container mx-auto -mt-16 px-4 md:px-6">
          <div className="relative">
            <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-primary/5 opacity-50 blur-3xl"></div>
            <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-accent/5 opacity-50 blur-3xl"></div>
            <div className="relative mx-auto max-w-5xl rounded-t-lg border-x border-t bg-card/50 p-2 shadow-2xl">
              <div className="flex h-6 items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <Image
              src="https://picsum.photos/seed/vibely-app/1200/800"
              alt="Vibely App Screenshot"
              width={1200}
              height={800}
              className="relative z-10 mx-auto rounded-b-xl border shadow-2xl"
              data-ai-hint="app screenshot"
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-20 md:py-32 mt-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl">
                Powerful Features, Effortless Collaboration
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to keep your team in sync and productive, supercharged by AI.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<MessageSquare />}
                title="Real-Time Messaging"
                description="Organize conversations in public or private channels with a seamless, responsive chat experience."
              />
              <FeatureCard
                icon={<Zap />}
                title="AI Automations"
                description="Save time with AI-powered automations like welcome messages, event invites, and ice-breakers."
              />
              <FeatureCard
                icon={<Sparkles />}
                title="Channel Assistant"
                description="Get smart suggestions for channel topics, descriptions, and automations to boost engagement."
              />
              <FeatureCard
                icon={<Users />}
                title="Team Collaboration"
                description="Easily manage members, share files, and keep track of conversations all in one place."
              />
              <FeatureCard
                icon={<Palette />}
                title="Customizable Themes"
                description="Personalize your workspace with beautiful, hand-crafted light and dark themes."
              />
              <FeatureCard
                icon={<ArrowRight />}
                title="And Much More..."
                description="Vibely is constantly evolving with new features to improve your team's communication."
              />
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="mx-auto mb-16 max-w-2xl text-center">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl">
                        Loved by Teams Everywhere
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        Don't just take our word for it. Here's what our customers have to say.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <TestimonialCard 
                        avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
                        name="Sarah Johnson"
                        title="CTO, Innovate Inc."
                        quote="Vibely has transformed how our team communicates. The AI assistant is a game-changer for keeping our channels organized and engaging. It's an indispensable tool for us now."
                    />
                     <TestimonialCard 
                        avatar="https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100"
                        name="Michael Chen"
                        title="Project Manager, DevSolutions"
                        quote="The ability to create custom themes and automations has made our workspace feel truly our own. Productivity is up, and the team has never been more connected. Highly recommended!"
                    />
                     <TestimonialCard 
                        avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                        name="Jessica Rodriguez"
                        title="Head of Remote Work, Global Connect"
                        quote="As a fully remote company, clear communication is everything. Vibely's real-time messaging and file sharing have become the backbone of our daily operations. It's simple, powerful, and just works."
                    />
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-muted/50">
            <div className="container mx-auto px-4 py-20 text-center md:px-6 md:py-24">
                 <div className="mx-auto max-w-2xl">
                    <h2 className="font-headline text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
                        Ready to Build a Better Vibe?
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                        Join thousands of productive teams and start communicating better today.
                    </p>
                    <div className="mt-8">
                        <Button size="lg" asChild>
                            <Link href="/signup">
                            Sign Up for Free <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>

      </main>

      <footer id="contact" className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <ChevronsRight className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-bold">Vibely</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Vibely. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
