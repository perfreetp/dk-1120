import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, Settings, Sparkles } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Slider } from '../components/ui/Slider';
import { Tag } from '../components/ui/Tag';
import { useVoting } from '../context/VotingContext';
import { SCENARIOS, Scenario } from '../types';

export function LaunchPage() {
  const navigate = useNavigate();
  const { createSession } = useVoting();
  const [sessionName, setSessionName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('dining');
  const [maxVotes, setMaxVotes] = useState(3);
  const [blacklistEnabled, setBlacklistEnabled] = useState(true);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');

  const timeSlots = [
    '周六中午', '周六下午', '周六晚上',
    '周日中午', '周日下午', '周日晚上'
  ];

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const addMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      setMembers([...members, newMember.trim()]);
      setNewMember('');
    }
  };

  const removeMember = (name: string) => {
    setMembers(members.filter(m => m !== name));
  };

  const handleCreateSession = () => {
    if (!sessionName.trim()) {
      alert('请输入局名');
      return;
    }

    createSession({
      name: sessionName,
      scenario: selectedScenario,
      maxVotesPerPerson: maxVotes,
      blacklistEnabled,
      availableTimes: selectedTimes,
      members: members.map(name => ({ name })),
    });

    navigate('/candidates');
  };

  return (
    <>
      <Header title="创建投票局" />
      <PageContainer>
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="text-primary" />
                选择场景
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(SCENARIOS).map(([key, { label, emoji }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedScenario(key as Scenario)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedScenario === key
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-gray-200 hover:border-primary hover:bg-primary hover:bg-opacity-5'
                    }`}
                  >
                    <div className="text-3xl mb-2">{emoji}</div>
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="text-secondary" />
                基本设置
              </h2>
              <Input
                label="投票局名称"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="例如：周六火锅局"
              />
              <Slider
                label="每人最多投票数"
                value={maxVotes}
                onChange={setMaxVotes}
                min={1}
                max={5}
                marks={['1票', '3票', '5票']}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">开启排雷功能</span>
                <button
                  onClick={() => setBlacklistEnabled(!blacklistEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    blacklistEnabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    blacklistEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <p className="text-xs text-text-secondary">
                排雷功能允许成员标记不喜欢的选项，被多次排雷的选项会自动排除
              </p>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="text-accent" />
                可选时间
              </h2>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                      selectedTimes.includes(time)
                        ? 'border-accent bg-accent bg-opacity-10 text-accent'
                        : 'border-gray-200 hover:border-accent'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="text-success" />
                邀请成员
              </h2>
              <div className="flex gap-2">
                <Input
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="输入成员昵称"
                  onKeyPress={(e) => e.key === 'Enter' && addMember()}
                />
                <Button onClick={addMember} size="md">
                  <Plus size={20} />
                </Button>
              </div>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {members.map(member => (
                    <Tag 
                      key={member} 
                      variant="secondary"
                      onRemove={() => removeMember(member)}
                    >
                      {member}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Button 
            onClick={handleCreateSession} 
            size="lg" 
            className="w-full"
          >
            创建投票局
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
