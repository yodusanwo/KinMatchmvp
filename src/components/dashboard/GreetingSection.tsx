import { Headline, Subhead } from "@/components/brand";

type GreetingSectionProps = {
  firstName: string;
};

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function GreetingSection({ firstName }: GreetingSectionProps) {
  const greeting = getTimeBasedGreeting();

  return (
    <section className="rounded-2xl border border-ink/[0.12] bg-cream-deep/80 p-5">
      <Headline className="text-center">
        {greeting}, {firstName}.
      </Headline>
      <Subhead className="mt-3 text-center text-sm">
        How connected do you feel today?
      </Subhead>
    </section>
  );
}
