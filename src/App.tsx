import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { VotingProvider } from './context/VotingContext';
import { BottomNav } from './components/layout/BottomNav';
import { LaunchPage } from './pages/LaunchPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { VotingPage } from './pages/VotingPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  return (
    <VotingProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<LaunchPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/voting/:sessionId" element={<VotingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/:sessionId" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </VotingProvider>
  );
}

export default App;
