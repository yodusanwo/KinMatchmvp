export type CreateVoiceNoteResponse = {
  id: string;
  share_token: string;
};

export type FinalizeVoiceNoteResponse = {
  id: string;
  audio_url: string;
  duration_seconds: number;
};

export type SendVoiceNoteResponse = {
  sent: boolean;
  skipped?: boolean;
  listen_url: string;
  error?: string;
};
