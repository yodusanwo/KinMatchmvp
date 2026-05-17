import {
  BrandBar,
  BrandMark,
  Eyebrow,
  Headline,
  PrimaryButton,
  SecondaryButton,
  Subhead,
  TextLink,
} from "@/components/brand";

function ShowcaseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-ink/[0.12] pb-8">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </section>
  );
}

export default function DevPage() {
  return (
    <div className="min-h-screen bg-cream-deep">
      <div className="mx-auto min-h-screen max-w-[480px] bg-cream">
        <BrandBar />

        <div className="space-y-8 px-5 py-8">
          <ShowcaseSection title="Brand mark">
            <div className="flex items-end gap-6">
              <BrandMark size={28} />
              <BrandMark size={40} />
              <BrandMark size={56} />
            </div>
          </ShowcaseSection>

          <ShowcaseSection title="Typography">
            <Eyebrow>Tuesday morning</Eyebrow>
            <Headline>Who needs you today?</Headline>
            <Subhead>
              Her chemo session was Thursday. A voice note might mean more
              than you think.
            </Subhead>
          </ShowcaseSection>

          <ShowcaseSection title="Buttons">
            <PrimaryButton>Send voice note</PrimaryButton>
            <SecondaryButton>Add to notes</SecondaryButton>
          </ShowcaseSection>

          <ShowcaseSection title="Links">
            <TextLink href="#">Set up Held later</TextLink>
          </ShowcaseSection>

          <ShowcaseSection title="Composed example">
            <Eyebrow>your tribe · 5 people</Eyebrow>
            <Headline className="mt-2">Maya has been quiet</Headline>
            <Subhead className="mt-2">
              12 days since you last reached out. She mentioned the pottery
              class starts next week.
            </Subhead>
            <div className="mt-6 space-y-3">
              <PrimaryButton>Send voice note to Maya</PrimaryButton>
              <TextLink href="#">Not today</TextLink>
            </div>
          </ShowcaseSection>
        </div>
      </div>
    </div>
  );
}
