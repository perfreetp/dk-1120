import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, GripVertical, ArrowRight, Merge } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Slider } from '../components/ui/Slider';
import { Tag } from '../components/ui/Tag';
import { useVoting } from '../context/VotingContext';
import { Candidate } from '../types';
import { jaroWinkler } from '../utils/recommendation';

export function CandidatesPage() {
  const navigate = useNavigate();
  const { state, addCandidate, removeCandidate, mergeCandidates } = useVoting();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    price: 3,
    distance: 3,
    note: '',
  });
  const [similarPairs, setSimilarPairs] = useState<Array<{ candidates: Candidate[]; similarity: number }>>([]);

  useEffect(() => {
    if (!state.session) return;
    
    const pairs: Array<{ candidates: Candidate[]; similarity: number }> = [];
    const { candidates } = state.session;
    
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const similarity = jaroWinkler(candidates[i].name, candidates[j].name);
        if (similarity >= 0.7) {
          pairs.push({
            candidates: [candidates[i], candidates[j]],
            similarity,
          });
        }
      }
    }
    
    setSimilarPairs(pairs);
  }, [state.session]);

  const handleMerge = (candidatesToMerge: Candidate[]) => {
    if (candidatesToMerge.length >= 2) {
      mergeCandidates(candidatesToMerge.map(c => c.id));
      setShowMergeModal(false);
    }
  };

  const handleAddCandidate = () => {
    if (!newCandidate.name.trim()) {
      alert('请输入候选项名称');
      return;
    }

    addCandidate(newCandidate);
    setNewCandidate({ name: '', price: 3, distance: 3, note: '' });
    setShowAddModal(false);
  };

  if (!state.session) {
    return (
      <>
        <Header title="候选清单" />
        <PageContainer>
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">还没有投票局</h3>
            <p className="text-text-secondary mb-6">请先创建一个投票局</p>
            <Button onClick={() => navigate('/')}>
              去发起
            </Button>
          </Card>
        </PageContainer>
      </>
    );
  }

  const { candidates } = state.session;

  return (
    <>
      <Header 
        title="候选清单" 
        rightContent={
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus size={20} />
          </Button>
        }
      />
      <PageContainer>
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-primary to-accent text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">{state.session.name}</h3>
                <p className="text-sm opacity-90">
                  已添加 {candidates.length} 个候选项
                </p>
              </div>
              <Button 
                onClick={() => navigate('/results')}
                className="bg-white text-primary hover:bg-gray-100"
                size="sm"
              >
                查看结果
                <ArrowRight size={16} />
              </Button>
            </div>
          </Card>

          {candidates.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold mb-2">还没有候选</h3>
              <p className="text-text-secondary mb-6">添加一些候选项让大家投票吧</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus size={20} />
                添加候选
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate, index) => (
                <CandidateCard 
                  key={candidate.id} 
                  candidate={candidate}
                  index={index}
                  onRemove={() => removeCandidate(candidate.id)}
                />
              ))}
              
              <Button 
                onClick={() => setShowAddModal(true)}
                variant="ghost"
                className="w-full border-2 border-dashed border-gray-300"
              >
                <Plus size={20} />
                添加更多候选
              </Button>
            </div>
          )}

          {similarPairs.length > 0 && (
            <Card className="bg-secondary bg-opacity-10 border-2 border-secondary">
              <div className="flex items-center gap-3 mb-3">
                <Merge className="text-secondary" size={24} />
                <div className="flex-1">
                  <h4 className="font-bold text-secondary">智能合并建议</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    检测到 {similarPairs.length} 组相似选项
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {similarPairs.map((pair, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      {pair.candidates.map((c, i) => (
                        <span key={c.id} className="font-medium">
                          {c.name}{i < pair.candidates.length - 1 && ' + '}
                        </span>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleMerge(pair.candidates)}
                    >
                      合并
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </PageContainer>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加候选项"
      >
        <div className="space-y-4">
          <Input
            label="名称"
            value={newCandidate.name}
            onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
            placeholder="例如：海底捞火锅"
          />
          
          <Slider
            label="价格等级"
            value={newCandidate.price}
            onChange={(value) => setNewCandidate({...newCandidate, price: value})}
            min={1}
            max={5}
            marks={['¥', '¥¥', '¥¥¥', '¥¥¥¥', '¥¥¥¥¥']}
          />
          
          <Slider
            label="距离远近"
            value={newCandidate.distance}
            onChange={(value) => setNewCandidate({...newCandidate, distance: value})}
            min={1}
            max={5}
            marks={['很近', '较近', '适中', '较远', '很远']}
          />
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              备注
            </label>
            <textarea
              value={newCandidate.note}
              onChange={(e) => setNewCandidate({...newCandidate, note: e.target.value})}
              placeholder="补充信息：联系电话、推荐理由等"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 outline-none transition-all resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => setShowAddModal(false)}
              variant="ghost"
              className="flex-1"
            >
              取消
            </Button>
            <Button onClick={handleAddCandidate} className="flex-1">
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function CandidateCard({ 
  candidate, 
  index, 
  onRemove 
}: { 
  candidate: Candidate; 
  index: number;
  onRemove: () => void;
}) {
  return (
    <Card hoverable className="animate-slide-in" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start gap-3">
        <div className="text-gray-400 cursor-move">
          <GripVertical size={20} />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{candidate.name}</h3>
            <Tag variant="secondary" className="text-xs">
              {candidate.votes} 票
            </Tag>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              💰 {'¥'.repeat(candidate.price)}
            </span>
            <span className="flex items-center gap-1">
              📍 {'~'.repeat(candidate.distance)}
            </span>
          </div>
          
          {candidate.note && (
            <p className="text-sm text-text-secondary">{candidate.note}</p>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-danger transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </Card>
  );
}
