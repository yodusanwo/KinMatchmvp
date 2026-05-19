export type PlanPollOption = {
  index: 1 | 2 | 3;
  datetime: string;
};

export type PlanPoll = {
  id: string;
  poll_token: string;
  user_id: string;
  friend_id: string;
  message: string | null;
  option_1_datetime: string;
  option_2_datetime: string;
  option_3_datetime: string;
  selected_option: 1 | 2 | 3 | null;
  selected_at: string | null;
  decline_reason: string | null;
  created_at: string;
};

export type PublicPlanPoll = {
  poll_token: string;
  sender_name: string;
  friend_name: string;
  message: string | null;
  options: PlanPollOption[];
  selected_option: 1 | 2 | 3 | null;
};
