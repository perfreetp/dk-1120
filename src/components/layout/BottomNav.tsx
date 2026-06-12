import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, List, BarChart2, History } from 'lucide-react';

const navItems = [
  { path: '/', icon: Plus, label: '发起' },
  { path: '/candidates', icon: List, label: '候选' },
  { path: '/results', icon: BarChart2, label: '结果' },
  { path: '/history', icon: History, label: '历史' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-surface shadow-soft fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                  isActive 
                    ? 'text-primary bg-primary bg-opacity-10' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
