const SOCIAL_STATE_KEY = "talaba_social_state";

export interface SocialState {
  mutedUserIds: number[];
  blockedUserIds: number[];
  reportedPostIds: number[];
  pinnedPostIds: number[];
}

const DEFAULT_STATE: SocialState = {
  mutedUserIds: [],
  blockedUserIds: [],
  reportedPostIds: [],
  pinnedPostIds: [],
};

export function readSocialState(): SocialState {
  try {
    const raw = localStorage.getItem(SOCIAL_STATE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function writeSocialState(state: SocialState) {
  localStorage.setItem(SOCIAL_STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("social-state-change", { detail: state }));
}

export function toggleNumber(list: number[], value: number) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
