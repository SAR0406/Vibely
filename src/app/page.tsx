import Link from 'next/link';
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  Zap,
  Users,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      {icon}
    </div>
    <h3 className="mb-2 font-headline text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <ChevronsRight className="size-8 text-primary" />
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
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
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
                Get Started Free <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-block rounded-full border bg-muted px-3 py-1 text-sm">
              <Sparkles className="mr-2 inline size-4 text-primary" />
              AI-Powered Channel Assistance
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-6xl">
              Where Great Conversations Happen
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Vibely is a real-time messaging app that uses AI to make your team
              communication smarter, faster, and more organized.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start for Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Request a Demo
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="relative">
            <div className="absolute -left-16 -top-16 size-48 rounded-full bg-primary/5 opacity-50 blur-3xl"></div>
            <div className="absolute -right-16 bottom-0 size-64 rounded-full bg-accent/5 opacity-50 blur-3xl"></div>
            <Image
              src="https://picsum.photos/seed/vibely-app/1200/800"
              alt="Vibely App Screenshot"
              width={1200}
              height={800}
              className="relative z-10 mx-auto rounded-xl border shadow-2xl"
              data-ai-hint="app screenshot"
            />
          </div>
        </section>

        <section id="features" className="bg-muted/50 py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl">
                Powerful Features, Effortless Collaboration
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to keep your team in sync and productive.
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
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <ChevronsRight className="size-6 text-primary" />
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

// A component that's not exported
const ChevronsRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </svg>
);
