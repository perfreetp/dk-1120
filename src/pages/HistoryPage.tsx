import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar, Users, Trophy, RotateCcw, Settings, Trash2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useVoting } from '../context/VotingContext';
import { HistoryRecord, SCENARIOS } from '../types';
import { historyStorage, preferencesStorage, currentSessionStorage } from '../utils/storage';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function HistoryPage() {
  const navigate = useNavigate();
  const { createSession, addCandidate } = useVoting();
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [preferences, setPreferences] = useState(preferencesStorage.get());

  const history = historyStorage.get();

  const handleReuse = (record: HistoryRecord) => {
    const savedSession = currentSessionStorage.get();
    
    createSession({
      name: `${record.sessionName} (新)`,
      scenario: record.scenario,
      maxVotesPerPerson: preferences.defaultMaxVotes,
      blacklistEnabled: true,
      availableTimes: [],
      members: savedSession?.members?.map(m => ({ name: m.name })) || [],
    });

    if (savedSession?.candidates) {
      savedSession.candidates.forEach(c => {
        addCandidate({
          name: c.name,
          price: c.price,
          distance: c.distance,
          note: c.note,
          category: c.category,
        });
      });
    }
    
    navigate('/candidates');
  };

  const handleClearHistory = () => {
    if (confirm('确定要清除所有历史记录吗？')) {
      historyStorage.clear();
      window.location.reload();
    }
  };

  const handleUpdatePreferences = (key: string, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    preferencesStorage.set(updated);
  };

  return (
    <>
      <Header 
        title="历史局"
        rightContent={
          <Button 
            onClick={() => setShowPrefsModal(true)} 
            size="sm"
            variant="ghost"
          >
            <Settings size={20} />
          </Button>
        }
      />
      <PageContainer>
        <div className="space-y-6">
          {history.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-2">暂无历史记录</h3>
              <p className="text-text-secondary mb-6">创建投票局后会自动保存到这里</p>
              <Button onClick={() => navigate('/')}>
                去发起
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  共 {history.length} 条记录
                </p>
                <Button 
                  onClick={handleClearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                >
                  <Trash2 size={16} />
                  清除历史
                </Button>
              </div>

              <div className="space-y-4">
                {history.map((record, index) => (
                  <HistoryCard
                    key={record.id}
                    record={record}
                    index={index}
                    onReuse={() => handleReuse(record)}
                  />
                ))}
              </div>
            </>
          )}

          <Card className="bg-gradient-to-r from-accent to-primary text-white">
            <div className="flex items-center gap-3 mb-3">
              <History size={24} />
              <h3 className="font-bold">使用技巧</h3>
            </div>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• 点击历史局卡片可以复用投票设置</li>
              <li>• 相同成员会自动保存，方便下次邀请</li>
              <li>• 系统会自动合并相似的候选选项</li>
            </ul>
          </Card>
        </div>
      </PageContainer>

      <Modal
        isOpen={showPrefsModal}
        onClose={() => setShowPrefsModal(false)}
        title="偏好设置"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              默认投票数
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={preferences.defaultMaxVotes}
              onChange={(e) => handleUpdatePreferences('defaultMaxVotes', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              排雷阈值
            </label>
            <input
              type="number"
              min="1"
              value={preferences.blacklistThreshold}
              onChange={(e) => handleUpdatePreferences('blacklistThreshold', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none"
            />
            <p className="text-xs text-text-secondary mt-1">
              达到此人数排雷的选项会被自动排除
            </p>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => setShowPrefsModal(false)}
              className="w-full"
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function HistoryCard({ 
  record, 
  index, 
  onReuse 
}: { 
  record: HistoryRecord;
  index: number;
  onReuse: () => void;
}) {
  const scenario = SCENARIOS[record.scenario];
  const completedDate = format(new Date(record.completedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });

  return (
    <Card 
      hoverable 
      onClick={onReuse}
      className="animate-slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{scenario.emoji}</span>
            <h3 className="font-bold text-lg">{record.sessionName}</h3>
          </div>
          
          <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {completedDate}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              {record.memberCount} 人
            </span>
          </div>

          {record.finalDecision && (
            <div className="mt-3 flex items-center gap-2">
              <Trophy size={16} className="text-warning" />
              <span className="font-bold text-success">{record.finalDecision}</span>
            </div>
          )}
        </div>
        
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onReuse(); }}>
          <RotateCcw size={16} />
          复用
        </Button>
      </div>
    </Card>
  );
}
