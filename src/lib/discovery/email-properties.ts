import { getAppOrigin } from "@/lib/env";
import {
  discoveryPrimaryCtaLabel,
  renderDiscoveryQuestion,
  type DiscoveryPrompt,
} from "./prompt-library";

function outreachUrl(params: { friendId: string; promptDay: number }) {
  const search = new URLSearchParams({
    friend_id: params.friendId,
    day: String(params.promptDay),
  });
  return `${getAppOrigin()}/api/discovery/outreach?${search.toString()}`;
}

export function buildDiscoveryPromptEmailProperties(params: {
  prompt: DiscoveryPrompt;
  friendId: string;
  friendName: string;
}) {
  return {
    discovery_question: renderDiscoveryQuestion(params.prompt, params.friendName),
    discovery_category: params.prompt.category,
    discovery_depth_tier: params.prompt.depth_tier,
    primary_cta_label: discoveryPrimaryCtaLabel(),
    primary_cta_url: outreachUrl({
      friendId: params.friendId,
      promptDay: params.prompt.cycle * 2 - 1,
    }),
    secondary_cta_label: "Skip",
    secondary_cta_url: `${getAppOrigin()}/today`,
  };
}
