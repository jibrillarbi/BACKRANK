import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Trophy } from 'lucide-react';
import { api, type UserRank } from '../api/index';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await api.getUserLeaderboard(25);
        setLeaders(users);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const rankLabel = (rank: number) => {
    if (rank === 1) return '1';
    if (rank === 2) return '2';
    if (rank === 3) return '3';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-black p-4 pt-24 md:p-8 md:pt-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-semibold uppercase tracking-widest mb-4">
            <Trophy size={14} />
            Published Strategies
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Leaderboard</h1>
          <p className="text-base-content/70 text-lg">
            Ranked by each user&apos;s highest published deployment score.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <div className="bg-base-100/50 border border-base-300 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-base-300 bg-base-200/40">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Best Strategy</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-base-content/70">Score</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-base-content/70">Return</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-base-content/70">Sharpe</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-base-content/70">Win Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-base-content/70">Market</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Loader className="inline animate-spin text-blue-400" size={26} />
                      <p className="mt-3 text-base-content/70">Loading leaderboard...</p>
                    </td>
                  </tr>
                ) : leaders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-base-content/70">
                      No published strategies have scores yet.
                    </td>
                  </tr>
                ) : (
                  leaders.map((leader) => (
                    <tr
                      key={leader.userId}
                      onClick={() => navigate(`/profile/${leader.username.toLowerCase()}`)}
                      className="border-b border-base-300 hover:bg-base-200/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-full border font-bold ${
                            leader.rank === 1
                              ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-300'
                              : leader.rank === 2
                                ? 'border-slate-300/40 bg-slate-300/10 text-slate-200'
                                : leader.rank === 3
                                  ? 'border-amber-600/50 bg-amber-600/10 text-amber-300'
                                  : 'border-base-300 bg-base-200 text-base-content/70'
                          }`}>
                            {rankLabel(leader.rank)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{leader.username}</p>
                        <p className="text-xs text-base-content/50">{leader.totalTrades} trades</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-blue-300">{leader.strategyName}</p>
                        <p className="text-xs text-base-content/50">{leader.direction}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xl font-bold text-yellow-300">{leader.score.toFixed(1)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`font-semibold ${leader.return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {leader.return >= 0 ? '+' : ''}{leader.return.toFixed(2)}%
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-blue-300">{leader.sharpe.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-base-content">{leader.winRate.toFixed(1)}%</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-base-content">{leader.asset}</p>
                        <p className="text-xs text-base-content/50">{leader.timeframe}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
