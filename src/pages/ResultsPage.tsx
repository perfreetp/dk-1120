import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Share2, Check, Crown, AlertTriangle, BarChart3, Users, Bell } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { useVoting } from '../context/VotingContext';
import { Candidate } from '../types';

export function ResultsPage() {
  const navigate = useNavigate();
  const { state, finalizeDecision } = useVoting();
  const [copied, setCopied] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);

  const session = state.session;
  const recommendations = state.recommendations;

  if (!session) {
    return (
      <>
        <Header title="结论看板" />
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

  const { candidates, members, blacklistEnabled } = session;
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
  const votedMembers = members.filter(m => m.hasVoted).length;
  const unvotedMembers = members.filter(m => !m.hasVoted);
  
  const blacklistThreshold = members.length > 0 ? Math.max(1, Math.ceil(members.length / 2)) : 1;
  const blacklistedCandidates = blacklistEnabled 
    ? candidates.filter(c => c.blacklistedBy.length >= blacklistThreshold && c.blacklistedBy.length > 0)
    : [];

  const handleFinalize = (candidateId: string) => {
    if (confirm('确定要固定这个方案吗？固定后将无法更改。')) {
      finalizeDecision(candidateId);
      navigate('/history');
    }
  };

  const handleShare = () => {
    const text = `🎉 ${session.name} 投票结果\n\n🏆 推荐：${recommendations[0]?.name || '暂无'}\n📊 总票数：${totalVotes}\n👥 参与：${votedMembers}/${members.length}人\n\n快来看看大家的选择！`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReminder = () => {
    const unvotedNames = unvotedMembers.map(m => m.name).join('、');
    const text = `@${unvotedNames} 快来投票啦！\n${session.name} 还有投票待确认~`;
    
    navigator.clipboard.writeText(text).then(() => {
      setReminderCopied(true);
      setTimeout(() => setReminderCopied(false), 2000);
    });
  };

  return (
    <>
      <Header title="结论看板" />
      <PageContainer>
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary via-accent to-secondary text-white overflow-hidden relative">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white bg-opacity-10 rounded-full" />
            <div className="absolute -right-4 -bottom-8 w-24 h-24 bg-white bg-opacity-10 rounded-full" />
            <div className="relative">
              <h3 className="text-lg font-bold mb-2">{session.name}</h3>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <span>👥 {votedMembers}/{members.length} 人投票</span>
                <span>📊 {totalVotes} 票</span>
              </div>
            </div>
          </Card>

          {recommendations.length > 0 && (
            <Card className="bg-gradient-to-br from-warning to-primary text-white relative overflow-hidden">
              <Crown className="absolute top-4 right-4 opacity-20" size={64} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={24} />
                  <span className="font-bold text-lg">🏆 推荐方案</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  {recommendations[0].name}
                </h3>
                <div className="flex items-center gap-3 text-sm opacity-90">
                  <Tag className="bg-white bg-opacity-20 text-white">
                    {recommendations[0].votes} 票
                  </Tag>
                  <span>💰 {'¥'.repeat(recommendations[0].price)}</span>
                  <span>📍 {'~'.repeat(recommendations[0].distance)}</span>
                </div>
                {recommendations[0].note && (
                  <p className="mt-2 text-sm opacity-90">{recommendations[0].note}</p>
                )}
                {!session.finalDecision && (
                  <Button 
                    onClick={() => handleFinalize(recommendations[0].id)}
                    className="mt-4 bg-white text-primary hover:bg-gray-100"
                    size="sm"
                  >
                    固定此方案
                  </Button>
                )}
              </div>
            </Card>
          )}

          {session.finalDecision && (
            <Card className="bg-success bg-opacity-10 border-2 border-success">
              <div className="flex items-center gap-3">
                <Check className="text-success" size={32} />
                <div>
                  <h4 className="font-bold text-success">方案已确定</h4>
                  <p className="text-lg font-bold">{session.finalDecision}</p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <BarChart3 className="text-secondary" />
                投票排行
              </h3>
              <Button onClick={handleShare} size="sm" variant="ghost">
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? '已复制' : '分享'}
              </Button>
            </div>
            <div className="space-y-3">
              {recommendations.map((candidate, index) => (
                <ResultBar 
                  key={candidate.id} 
                  candidate={candidate} 
                  rank={index + 1}
                  maxVotes={recommendations[0]?.votes || 1}
                />
              ))}
            </div>
          </Card>

          {blacklistEnabled && blacklistedCandidates.length > 0 && (
            <Card className="bg-danger bg-opacity-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="text-danger" />
                <h3 className="font-bold text-danger">被排除的选项</h3>
              </div>
              <div className="space-y-2">
                {blacklistedCandidates.map(candidate => (
                  <div 
                    key={candidate.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <span className="font-medium">{candidate.name}</span>
                    <Tag variant="danger">
                      {candidate.blacklistedBy.length} 人排雷
                    </Tag>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="text-accent" />
                投票成员
              </h3>
              {unvotedMembers.length > 0 && (
                <Button 
                  onClick={handleReminder} 
                  size="sm" 
                  variant="secondary"
                >
                  {reminderCopied ? <Check size={16} /> : <Bell size={16} />}
                  {reminderCopied ? '已复制' : '提醒未投票'}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {members.map(member => (
                <div 
                  key={member.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    member.hasVoted ? 'bg-gray-50' : 'bg-warning bg-opacity-10 border-2 border-warning'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      member.hasVoted ? 'bg-success' : 'bg-warning'
                    }`}>
                      {member.name[0]}
                    </div>
                    <span className={`font-medium ${member.hasVoted ? '' : 'text-warning'}`}>
                      {member.name}
                      {!member.hasVoted && ' ⏰'}
                    </span>
                  </div>
                  <Tag variant={member.hasVoted ? 'secondary' : 'default'}>
                    {member.hasVoted ? `投票 ${member.votes.length} 项` : '未投票'}
                  </Tag>
                </div>
              ))}
            </div>
            {unvotedMembers.length > 0 && (
              <div className="mt-4 p-3 bg-warning bg-opacity-10 rounded-lg">
                <p className="text-sm text-warning flex items-center gap-2">
                  <Bell size={16} />
                  还有 {unvotedMembers.length} 人未投票：{unvotedMembers.map(m => m.name).join('、')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </PageContainer>
    </>
  );
}

function ResultBar({ 
  candidate, 
  rank, 
  maxVotes 
}: { 
  candidate: Candidate; 
  rank: number;
  maxVotes: number;
}) {
  const percentage = (candidate.votes / maxVotes) * 100;
  const isTop = rank === 1;
  
  return (
    <div 
      className="relative p-3 bg-white rounded-lg border-2 transition-all animate-slide-in"
      style={{ animationDelay: `${rank * 50}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg ${isTop ? 'text-primary' : 'text-text-secondary'}`}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
          </span>
          <span className="font-bold">{candidate.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag variant={isTop ? 'primary' : 'default'} className="text-xs">
            {candidate.votes} 票
          </Tag>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isTop ? 'bg-primary' : 'bg-secondary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
