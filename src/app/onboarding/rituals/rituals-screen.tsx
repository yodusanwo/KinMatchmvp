import Link from "next/link";
import { BrandBar, Eyebrow, Headline, TextLink } from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";

const TEMPLATES = [
  {
    id: "parent_call",
    title: "Weekly call with a parent",
    detail: "A simple weekly rhythm with someone who raised you.",
  },
  {
    id: "coffee",
    title: "Coffee with someone close",
    detail: "Every other week, in person when you can.",
  },
  {
    id: "monthly_dinner",
    title: "Monthly dinner with a group",
    detail: "For the people who feel easier around a table.",
  },
  {
    id: "birthday_call",
    title: "Birthday call ritual",
    detail: "A yearly reminder to show up before the day passes.",
  },
  {
    id: "quarterly_trip",
    title: "Quarterly trip with friends",
    detail: "Something to keep the long arc alive.",
  },
  {
    id: "sunday_family",
    title: "Sunday family time",
    detail: "A weekly pocket for the family you want close.",
  },
];

export function OnboardingRitualsScreen() {
  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-[calc(100vh-65px)] flex-col justify-between px-5 py-8">
        <div>
          <Eyebrow>rituals · standing dates</Eyebrow>
          <Headline className="mt-2">Want to start with a rhythm?</Headline>
          <p className="mt-3 font-inter text-sm italic leading-relaxed text-ink-soft">
            Standing dates with your people are the easiest way to keep a
            friendship in rhythm. Pick one to start, or skip.
          </p>

          <div className="mt-8 grid gap-3">
            {TEMPLATES.map((template) => (
              <Link
                key={template.id}
                href={`/rituals/new?template=${template.id}`}
                className="rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-4"
              >
                <p className="font-sans text-sm font-medium text-ink">
                  {template.title}
                </p>
                <p className="mt-1 font-inter text-xs italic leading-relaxed text-ink-soft">
                  {template.detail}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center">
          <TextLink href="/today">I&apos;ll add my own later</TextLink>
        </p>
      </div>
    </AppShell>
  );
}
