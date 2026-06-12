import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Clock, Users, Check } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { useVoting } from '../context/VotingContext';
import { Member, Candidate } from '../types';

export function VotingPage() {
  const navigate = useNavigate();
  const { state, vote, blacklist, setAvailableTimes } = useVoting();
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [showVotingSection, setShowVotingSection] = useState(false);

  const session = state.session;

  useEffect(() => {
    if (session && session.members.length > 0) {
      setCurrentMember(session.members[0]);
    }
  }, [session]);

  if (!session) {
    return (
      <>
        <Header title="成员投票" />
        <PageContainer>
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">投票局不存在</h3>
            <p className="text-text-secondary mb-6">请检查链接是否正确</p>
            <Button onClick={() => navigate('/')}>
              返回首页
            </Button>
          </Card>
        </PageContainer>
      </>
    );
  }

  const { candidates, members, maxVotesPerPerson, blacklistEnabled, availableTimes } = session;
  const votedCount = currentMember?.votes.length ?? 0;
  const canVote = votedCount < maxVotesPerPerson;

  const handleVote = (candidateId: string) => {
    if (!currentMember) return;
    
    if (!canVote && !currentMember.votes.includes(candidateId)) {
      alert(`最多只能投 ${maxVotesPerPerson} 票`);
      return;
    }
    
    vote(currentMember.id, candidateId);
  };

  const handleBlacklist = (candidateId: string) => {
    if (!currentMember || !blacklistEnabled) return;
    blacklist(currentMember.id, candidateId);
  };

  const handleTimeToggle = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleConfirmTimes = () => {
    if (!currentMember) return;
    setAvailableTimes(currentMember.id, selectedTimes);
    setShowVotingSection(true);
  };

  const votedCandidates = candidates.filter(c => currentMember?.votes.includes(c.id));
  const blacklistedCandidates = candidates.filter(c => currentMember?.blacklisted.includes(c.id));

  return (
    <>
      <Header title="成员投票" />
      <PageContainer>
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-secondary to-success text-white">
            <div>
              <h3 className="text-lg font-bold mb-1">{session.name}</h3>
              <p className="text-sm opacity-90 mb-4">
                {members.length} 位成员已邀请 · {members.filter(m => m.hasVoted).length} 人已投票
              </p>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span className="text-sm">当前：{currentMember?.name}</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {votedCount}/{maxVotesPerPerson}
                </div>
                <div className="text-sm text-text-secondary">已投票数</div>
              </div>
            </Card>
            
            {blacklistEnabled && (
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-danger mb-1">
                    {blacklistedCandidates.length}
                  </div>
                  <div className="text-sm text-text-secondary">已排雷数</div>
                </div>
              </Card>
            )}
          </div>

          {!showVotingSection ? (
            <Card>
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Clock className="text-accent" />
                  选择你有空的时间
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeToggle(time)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        selectedTimes.includes(time)
                          ? 'border-accent bg-accent bg-opacity-10 text-accent'
                          : 'border-gray-200 hover:border-accent'
                      }`}
                    >
                      {selectedTimes.includes(time) && <Check size={16} className="inline mr-1" />}
                      {time}
                    </button>
                  ))}
                </div>
                <Button onClick={handleConfirmTimes} className="w-full" size="lg">
                  开始投票
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card>
                <h3 className="font-bold mb-4">为你喜欢的选项投票 👇</h3>
                <div className="space-y-3">
                  {candidates.map((candidate, index) => {
                    const isVoted = currentMember?.votes.includes(candidate.id) ?? false;
                    const isBlacklisted = currentMember?.blacklisted.includes(candidate.id) ?? false;
                    
                    return (
                      <CandidateVotingCard
                        key={candidate.id}
                        candidate={candidate}
                        index={index}
                        isVoted={isVoted}
                        isBlacklisted={isBlacklisted}
                        canVote={canVote || isVoted}
                        onVote={() => handleVote(candidate.id)}
                        onBlacklist={() => handleBlacklist(candidate.id)}
                        blacklistEnabled={blacklistEnabled}
                      />
                    );
                  })}
                </div>
              </Card>

              {votedCandidates.length > 0 && (
                <Card className="bg-primary bg-opacity-5 border-2 border-primary">
                  <h3 className="font-bold text-primary mb-3">✅ 你的投票</h3>
                  <div className="flex flex-wrap gap-2">
                    {votedCandidates.map(c => (
                      <Tag key={c.id} variant="primary">
                        {c.name}
                      </Tag>
                    ))}
                  </div>
                </Card>
              )}

              {blacklistEnabled && blacklistedCandidates.length > 0 && (
                <Card className="bg-danger bg-opacity-5 border-2 border-danger">
                  <h3 className="font-bold text-danger mb-3">🚫 你排雷的</h3>
                  <div className="flex flex-wrap gap-2">
                    {blacklistedCandidates.map(c => (
                      <Tag key={c.id} variant="danger">
                        {c.name}
                      </Tag>
                    ))}
                  </div>
                </Card>
              )}

              <Button 
                onClick={() => navigate(`/results/${session.id}`)}
                className="w-full" 
                size="lg"
              >
                查看投票结果
              </Button>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}

function CandidateVotingCard({
  candidate,
  index,
  isVoted,
  isBlacklisted,
  canVote,
  onVote,
  onBlacklist,
  blacklistEnabled,
}: {
  candidate: Candidate;
  index: number;
  isVoted: boolean;
  isBlacklisted: boolean;
  canVote: boolean;
  onVote: () => void;
  onBlacklist: () => void;
  blacklistEnabled: boolean;
}) {
  return (
    <div 
      className={`p-4 rounded-xl border-2 transition-all animate-slide-in ${
        isVoted 
          ? 'border-primary bg-primary bg-opacity-5' 
          : isBlacklisted
          ? 'border-danger bg-danger bg-opacity-5'
          : 'border-gray-200 hover:border-primary'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-bold">{candidate.name}</h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
            <span>💰 {'¥'.repeat(candidate.price)}</span>
            <span>📍 {'~'.repeat(candidate.distance)}</span>
            <Tag variant={candidate.votes > 0 ? 'primary' : 'default'} className="text-xs">
              {candidate.votes} 票
            </Tag>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onVote}
            className={`p-3 rounded-full transition-all ${
              isVoted
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-primary hover:text-white'
            }`}
            disabled={!canVote && !isVoted}
          >
            <ThumbsUp size={20} />
          </button>
          
          {blacklistEnabled && (
            <button
              onClick={onBlacklist}
              className={`p-3 rounded-full transition-all ${
                isBlacklisted
                  ? 'bg-danger text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-danger hover:text-white'
              }`}
            >
              <ThumbsDown size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
