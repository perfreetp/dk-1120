import { Candidate, Member, VotingSession } from '../types';

export function generateRecommendation(session: VotingSession): Candidate[] {
  const { candidates, members, blacklistEnabled } = session;
  
  if (members.length === 0) {
    return candidates;
  }
  
  const blacklistThreshold = Math.max(1, Math.ceil(members.length / 2));
  
  const validCandidates = blacklistEnabled 
    ? candidates.filter(c => c.blacklistedBy.length < blacklistThreshold)
    : candidates;
  
  const scoredCandidates = validCandidates.map(candidate => {
    let score = 0;
    
    score += candidate.votes * 10;
    
    const timeScore = calculateTimeScore(candidate, members);
    score += timeScore * 5;
    
    if (blacklistEnabled && candidate.blacklistedBy.length > 0) {
      const blacklistPenalty = (candidate.blacklistedBy.length / members.length) * -20;
      score += blacklistPenalty;
    }
    
    return { ...candidate, score };
  });
  
  return scoredCandidates.sort((a, b) => b.score - a.score);
}

function calculateTimeScore(candidate: Candidate, members: Member[]): number {
  const voters = members.filter(m => m.votes.includes(candidate.id));
  if (voters.length === 0) return 0;
  
  const totalAvailability = voters.reduce((sum, m) => 
    sum + m.availableTimes.length, 0
  );
  const maxPossible = voters.length * 7;
  
  return (totalAvailability / maxPossible) * 100;
}

export function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0 || len2 === 0) return 0;
  
  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  const prefixLen = getCommonPrefixLength(s1, s2);
  
  return jaro + prefixLen * 0.1 * (1 - jaro);
}

function getCommonPrefixLength(s1: string, s2: string): number {
  let common = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) common++;
    else break;
  }
  return common;
}

export function mergeSimilarCandidates(
  candidates: Candidate[],
  threshold: number = 0.8
): { merged: Candidate[]; suggestions: Array<{ candidates: Candidate[]; similarity: number }> } {
  const merged: Candidate[] = [];
  const used = new Set<string>();
  const suggestions: Array<{ candidates: Candidate[]; similarity: number }> = [];
  
  for (let i = 0; i < candidates.length; i++) {
    if (used.has(candidates[i].id)) continue;
    
    const similar = candidates.filter(c => 
      !used.has(c.id) && 
      jaroWinkler(candidates[i].name, c.name) >= threshold
    );
    
    if (similar.length > 0) {
      const allCandidates = [candidates[i], ...similar];
      const similarity = jaroWinkler(candidates[i].name, similar[0].name);
      suggestions.push({ candidates: allCandidates, similarity });
      
      const mergedCandidate = mergeCandidates(allCandidates);
      merged.push(mergedCandidate);
      allCandidates.forEach(c => used.add(c.id));
    } else {
      merged.push(candidates[i]);
      used.add(candidates[i].id);
    }
  }
  
  return { merged, suggestions };
}

function mergeCandidates(candidates: Candidate[]): Candidate {
  const merged: Candidate = {
    id: candidates[0].id,
    name: candidates[0].name,
    price: Math.round(candidates.reduce((sum, c) => sum + c.price, 0) / candidates.length),
    distance: Math.round(candidates.reduce((sum, c) => sum + c.distance, 0) / candidates.length),
    note: candidates.map(c => c.note).filter(Boolean).join('; '),
    votes: Math.max(...candidates.map(c => c.votes)),
    blacklistedBy: [...new Set(candidates.flatMap(c => c.blacklistedBy))],
  };
  
  return merged;
}
