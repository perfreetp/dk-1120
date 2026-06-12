import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { 
  VotingSession, 
  Candidate, 
  Member, 
  Scenario, 
  HistoryRecord,
  generateId 
} from '../types';
import { currentSessionStorage, historyStorage } from '../utils/storage';
import { generateRecommendation } from '../utils/recommendation';

interface VotingState {
  session: VotingSession | null;
  recommendations: Candidate[];
  history: HistoryRecord[];
}

type VotingAction =
  | { type: 'CREATE_SESSION'; payload: Omit<VotingSession, 'id' | 'createdAt' | 'updatedAt' | 'candidates' | 'members' | 'status'> & { members?: Member[] } }
  | { type: 'ADD_CANDIDATE'; payload: Omit<Candidate, 'id' | 'votes' | 'blacklistedBy'> }
  | { type: 'REMOVE_CANDIDATE'; payload: string }
  | { type: 'MERGE_CANDIDATES'; payload: string[] }
  | { type: 'ADD_MEMBER'; payload: Omit<Member, 'id' | 'hasVoted' | 'availableTimes' | 'votes' | 'blacklisted'> }
  | { type: 'REMOVE_MEMBER'; payload: string }
  | { type: 'VOTE'; payload: { memberId: string; candidateId: string } }
  | { type: 'BLACKLIST'; payload: { memberId: string; candidateId: string } }
  | { type: 'SET_AVAILABLE_TIMES'; payload: { memberId: string; times: string[] } }
  | { type: 'CLOSE_SESSION' }
  | { type: 'FINALIZE_DECISION'; payload: string }
  | { type: 'LOAD_SESSION'; payload: VotingSession }
  | { type: 'RESET_SESSION' };

const initialState: VotingState = {
  session: null,
  recommendations: [],
  history: historyStorage.get(),
};

function votingReducer(state: VotingState, action: VotingAction): VotingState {
  switch (action.type) {
    case 'CREATE_SESSION': {
      const newSession: VotingSession = {
        ...action.payload,
        id: generateId(),
        candidates: [],
        members: action.payload.members || [],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(newSession);
      return { ...state, session: newSession, recommendations: [] };
    }

    case 'ADD_CANDIDATE': {
      if (!state.session) return state;
      const newCandidate: Candidate = {
        ...action.payload,
        id: generateId(),
        votes: 0,
        blacklistedBy: [],
      };
      const updatedSession = {
        ...state.session,
        candidates: [...state.session.candidates, newCandidate],
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      const recommendations = generateRecommendation(updatedSession);
      return { ...state, session: updatedSession, recommendations };
    }

    case 'REMOVE_CANDIDATE': {
      if (!state.session) return state;
      const updatedSession = {
        ...state.session,
        candidates: state.session.candidates.filter(c => c.id !== action.payload),
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      const recommendations = generateRecommendation(updatedSession);
      return { ...state, session: updatedSession, recommendations };
    }

    case 'MERGE_CANDIDATES': {
      if (!state.session) return state;
      const candidateIds = action.payload;
      const candidatesToMerge = state.session.candidates.filter(c => 
        candidateIds.includes(c.id)
      );
      
      if (candidatesToMerge.length < 2) return state;
      
      const voters = new Set<string>();
      candidatesToMerge.forEach(candidate => {
        state.session!.members.forEach(member => {
          if (member.votes.includes(candidate.id)) {
            voters.add(member.id);
          }
        });
      });
      
      const mergedCandidate: Candidate = {
        id: candidatesToMerge[0].id,
        name: candidatesToMerge[0].name,
        price: Math.round(candidatesToMerge.reduce((sum, c) => sum + c.price, 0) / candidatesToMerge.length),
        distance: Math.round(candidatesToMerge.reduce((sum, c) => sum + c.distance, 0) / candidatesToMerge.length),
        note: candidatesToMerge.map(c => c.note).filter(Boolean).join('; '),
        votes: voters.size,
        blacklistedBy: [...new Set(candidatesToMerge.flatMap(c => c.blacklistedBy))],
      };
      
      const remainingCandidates = state.session.candidates.filter(c => 
        !candidateIds.includes(c.id)
      );
      
      const updatedMembers = state.session.members.map(member => {
        const hasVotedForMerged = candidatesToMerge.some(c => member.votes.includes(c.id));
        if (!hasVotedForMerged) return member;
        
        return {
          ...member,
          votes: [
            mergedCandidate.id,
            ...member.votes.filter(id => !candidateIds.includes(id))
          ],
        };
      });
      
      const updatedSession = {
        ...state.session,
        candidates: [...remainingCandidates, mergedCandidate],
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
      };
      
      currentSessionStorage.set(updatedSession);
      const recommendations = generateRecommendation(updatedSession);
      return { ...state, session: updatedSession, recommendations };
    }

    case 'ADD_MEMBER': {
      if (!state.session) return state;
      const newMember: Member = {
        ...action.payload,
        id: generateId(),
        hasVoted: false,
        availableTimes: [],
        votes: [],
        blacklisted: [],
      };
      const updatedSession = {
        ...state.session,
        members: [...state.session.members, newMember],
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      return { ...state, session: updatedSession };
    }

    case 'REMOVE_MEMBER': {
      if (!state.session) return state;
      const updatedSession = {
        ...state.session,
        members: state.session.members.filter(m => m.id !== action.payload),
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      return { ...state, session: updatedSession };
    }

    case 'VOTE': {
      if (!state.session) return state;
      const { memberId, candidateId } = action.payload;
      const updatedMembers = state.session.members.map(member => {
        if (member.id !== memberId) return member;
        
        const hasVoted = member.votes.includes(candidateId);
        return {
          ...member,
          hasVoted: true,
          votes: hasVoted 
            ? member.votes.filter(id => id !== candidateId)
            : [...member.votes, candidateId],
        };
      });
      
      const updatedCandidates = state.session.candidates.map(candidate => {
        const voter = state.session!.members.find(m => m.id === memberId);
        const wasVoted = voter?.votes.includes(candidateId) ?? false;
        
        if (candidate.id !== candidateId) return candidate;
        return {
          ...candidate,
          votes: wasVoted ? candidate.votes - 1 : candidate.votes + 1,
        };
      });
      
      const updatedSession = {
        ...state.session,
        members: updatedMembers,
        candidates: updatedCandidates,
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      const recommendations = generateRecommendation(updatedSession);
      return { ...state, session: updatedSession, recommendations };
    }

    case 'BLACKLIST': {
      if (!state.session || !state.session.blacklistEnabled) return state;
      const { memberId, candidateId } = action.payload;
      
      const updatedMembers = state.session.members.map(member => {
        if (member.id !== memberId) return member;
        const hasBlacklisted = member.blacklisted.includes(candidateId);
        return {
          ...member,
          blacklisted: hasBlacklisted 
            ? member.blacklisted.filter(id => id !== candidateId)
            : [...member.blacklisted, candidateId],
        };
      });
      
      const updatedCandidates = state.session.candidates.map(candidate => {
        const member = state.session!.members.find(m => m.id === memberId);
        const hadBlacklisted = member?.blacklisted.includes(candidateId) ?? false;
        
        if (candidate.id !== candidateId) return candidate;
        return {
          ...candidate,
          blacklistedBy: hadBlacklisted 
            ? candidate.blacklistedBy.filter(id => id !== memberId)
            : [...candidate.blacklistedBy, memberId],
        };
      });
      
      const updatedSession = {
        ...state.session,
        members: updatedMembers,
        candidates: updatedCandidates,
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      const recommendations = generateRecommendation(updatedSession);
      return { ...state, session: updatedSession, recommendations };
    }

    case 'SET_AVAILABLE_TIMES': {
      if (!state.session) return state;
      const updatedSession = {
        ...state.session,
        members: state.session.members.map(member =>
          member.id === action.payload.memberId
            ? { ...member, availableTimes: action.payload.times }
            : member
        ),
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      return { ...state, session: updatedSession };
    }

    case 'CLOSE_SESSION': {
      if (!state.session) return state;
      const updatedSession = {
        ...state.session,
        status: 'closed' as const,
        updatedAt: new Date().toISOString(),
      };
      currentSessionStorage.set(updatedSession);
      return { ...state, session: updatedSession };
    }

    case 'FINALIZE_DECISION': {
      if (!state.session) return state;
      const candidate = state.session.candidates.find(c => c.id === action.payload);
      if (!candidate) return state;
      
      const updatedSession = {
        ...state.session,
        status: 'closed' as const,
        finalDecision: candidate.name,
        updatedAt: new Date().toISOString(),
      };
      
      const historyRecord: HistoryRecord = {
        id: generateId(),
        sessionId: updatedSession.id,
        sessionName: updatedSession.name,
        scenario: updatedSession.scenario,
        memberCount: updatedSession.members.length,
        finalDecision: candidate.name,
        completedAt: new Date().toISOString(),
        candidates: updatedSession.candidates.map(c => ({
          name: c.name,
          price: c.price,
          distance: c.distance,
          note: c.note,
          category: c.category,
        })),
        members: updatedSession.members.map(m => ({ name: m.name })),
      };
      
      historyStorage.add(historyRecord);
      currentSessionStorage.remove();
      
      return {
        ...state,
        session: updatedSession,
        history: historyStorage.get(),
      };
    }

    case 'LOAD_SESSION': {
      const recommendations = generateRecommendation(action.payload);
      return { ...state, session: action.payload, recommendations };
    }

    case 'RESET_SESSION': {
      currentSessionStorage.remove();
      return { ...state, session: null, recommendations: [] };
    }

    default:
      return state;
  }
}

interface VotingContextType {
  state: VotingState;
  createSession: (data: { name: string; scenario: Scenario; maxVotesPerPerson: number; blacklistEnabled: boolean; availableTimes: string[]; members?: Array<{ name: string }> }) => void;
  addCandidate: (candidate: Omit<Candidate, 'id' | 'votes' | 'blacklistedBy'>) => void;
  removeCandidate: (id: string) => void;
  mergeCandidates: (candidateIds: string[]) => void;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  vote: (memberId: string, candidateId: string) => void;
  blacklist: (memberId: string, candidateId: string) => void;
  setAvailableTimes: (memberId: string, times: string[]) => void;
  closeSession: () => void;
  finalizeDecision: (candidateId: string) => void;
  loadSession: (session: VotingSession) => void;
  resetSession: () => void;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export function VotingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(votingReducer, initialState);

  useEffect(() => {
    const savedSession = currentSessionStorage.get();
    if (savedSession) {
      dispatch({ type: 'LOAD_SESSION', payload: savedSession });
    }
  }, []);

  const createSession = (data: { name: string; scenario: Scenario; maxVotesPerPerson: number; blacklistEnabled: boolean; availableTimes: string[]; members?: Array<{ name: string }> }) => {
    const initialMembers: Member[] = (data.members || []).map(m => ({
      id: generateId(),
      name: m.name,
      hasVoted: false,
      availableTimes: [],
      votes: [],
      blacklisted: [],
    }));
    
    dispatch({ 
      type: 'CREATE_SESSION', 
      payload: { 
        id: '', 
        name: data.name, 
        scenario: data.scenario, 
        creatorId: 'user',
        maxVotesPerPerson: data.maxVotesPerPerson,
        blacklistEnabled: data.blacklistEnabled,
        availableTimes: data.availableTimes,
        createdAt: '',
        updatedAt: '',
        status: 'active',
        members: initialMembers,
      } as any
    });
  };

  const addCandidate = (candidate: Omit<Candidate, 'id' | 'votes' | 'blacklistedBy'>) => {
    dispatch({ type: 'ADD_CANDIDATE', payload: candidate });
  };

  const removeCandidate = (id: string) => {
    dispatch({ type: 'REMOVE_CANDIDATE', payload: id });
  };

  const mergeCandidates = (candidateIds: string[]) => {
    dispatch({ type: 'MERGE_CANDIDATES', payload: candidateIds });
  };

  const addMember = (name: string) => {
    dispatch({ type: 'ADD_MEMBER', payload: { name } as any });
  };

  const removeMember = (id: string) => {
    dispatch({ type: 'REMOVE_MEMBER', payload: id });
  };

  const vote = (memberId: string, candidateId: string) => {
    dispatch({ type: 'VOTE', payload: { memberId, candidateId } });
  };

  const blacklist = (memberId: string, candidateId: string) => {
    dispatch({ type: 'BLACKLIST', payload: { memberId, candidateId } });
  };

  const setAvailableTimes = (memberId: string, times: string[]) => {
    dispatch({ type: 'SET_AVAILABLE_TIMES', payload: { memberId, times } });
  };

  const closeSession = () => {
    dispatch({ type: 'CLOSE_SESSION' });
  };

  const finalizeDecision = (candidateId: string) => {
    dispatch({ type: 'FINALIZE_DECISION', payload: candidateId });
  };

  const loadSession = (session: VotingSession) => {
    dispatch({ type: 'LOAD_SESSION', payload: session });
  };

  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  return (
    <VotingContext.Provider value={{
      state,
      createSession,
      addCandidate,
      removeCandidate,
      mergeCandidates,
      addMember,
      removeMember,
      vote,
      blacklist,
      setAvailableTimes,
      closeSession,
      finalizeDecision,
      loadSession,
      resetSession,
    }}>
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error('useVoting must be used within VotingProvider');
  }
  return context;
}
