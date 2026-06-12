export type Scenario = 'dining' | 'outing' | 'movie' | 'other';

export interface Candidate {
  id: string;
  name: string;
  price: number;
  distance: number;
  note: string;
  category?: string;
  votes: number;
  blacklistedBy: string[];
}

export interface Member {
  id: string;
  name: string;
  hasVoted: boolean;
  availableTimes: string[];
  votes: string[];
  blacklisted: string[];
}

export interface VotingSession {
  id: string;
  name: string;
  scenario: Scenario;
  creatorId: string;
  candidates: Candidate[];
  members: Member[];
  maxVotesPerPerson: number;
  blacklistEnabled: boolean;
  availableTimes: string[];
  deadline?: string;
  status: 'active' | 'closed';
  finalDecision?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  favoriteCandidates: Candidate[];
  commonMembers: Member[];
  defaultMaxVotes: number;
  blacklistThreshold: number;
}

export interface HistoryRecord {
  id: string;
  sessionId: string;
  sessionName: string;
  scenario: Scenario;
  memberCount: number;
  finalDecision: string;
  completedAt: string;
  candidates?: Array<{ name: string; price: number; distance: number; note: string; category?: string }>;
  members?: Array<{ name: string }>;
}

export const SCENARIOS: Record<Scenario, { label: string; emoji: string }> = {
  dining: { label: '聚餐', emoji: '🍜' },
  outing: { label: '出游', emoji: '🏕️' },
  movie: { label: '观影', emoji: '🎬' },
  other: { label: '其他', emoji: '🎮' },
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
