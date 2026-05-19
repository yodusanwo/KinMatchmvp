import { PlanPollScreen } from "./plan-poll-screen";

type PageProps = {
  params: Promise<{ pollToken: string }>;
};

export default async function PublicPlanPollPage({ params }: PageProps) {
  const { pollToken } = await params;
  return <PlanPollScreen pollToken={pollToken} />;
}
