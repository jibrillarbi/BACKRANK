import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../api/useAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  // Check if a route is active
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Get username for avatar dropdown
  const username = currentUser?.username || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="navbar bg-black shadow-lg fixed top-0 left-0 right-0 z-50 h-16">
      {/* Left Section: Logo + Mobile Menu Button */}
      <div className="flex-1">
        <button
          onClick={() => navigate(currentUser ? '/' : '/landing')}
          className="btn btn-ghost gap-3 "
        >
          <img src="/src/assets/logo.png" alt="BackRank" className="h-12 w-12" />
          <span className="text-2xl font-bold text-secondary">BackRank</span>
        </button>
      </div>

      {/* Center Section: Core Navigation */}
      <div className="flex-none gap-2 hidden md:flex">
        {!currentUser ? (
          <>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/')}
              className={`btn btn-ghost btn-sm ${isActive('/') ? 'btn-active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/explore')}
              className={`btn btn-ghost btn-sm ${isActive('/explore') ? 'btn-active' : ''}`}
            >
              Explore
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className={`btn btn-ghost btn-sm ${isActive('/leaderboard') ? 'btn-active' : ''}`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => navigate('/strategies')}
              className={`btn btn-ghost btn-sm ${isActive('/strategies') ? 'btn-active' : ''}`}
            >
              My Strategies
            </button>
            <button
              onClick={() => navigate('/create-post')}
              className={`btn btn-ghost btn-sm ${isActive('/create-post') ? 'btn-active' : ''}`}
            >
              Share
            </button>

            {/* Backtest Button */}
            <button
              onClick={() => navigate('/strategy')}
              className="btn btn-primary btn-sm hidden sm:flex"
            >
              Backtest
            </button>
          </>
        )}
      </div>

      {/* Right Section: Auth Buttons / Avatar */}
      <div className="flex gap-2">
        {!currentUser ? (
          <>
            <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm hidden sm:flex">
              Log In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn btn-primary btn-sm"
            >
              Get Started
            </button>
          </>
        ) : (
          <>
            {/* User Avatar Dropdown */}
            <div className="dropdown dropdown-end">
              <button className="btn btn-ghost btn-circle avatar placeholder btn-sm">
                <div className="bg-secondary text-secondary-content font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full">
                  {username.charAt(0).toUpperCase()}
                </div>
              </button>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span className="text-xs opacity-75">{currentUser.email}</span>
                </li>
                <li>
                  <button onClick={() => navigate(`/profile/${username.toLowerCase()}`)}>
                    👤 My Profile
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/strategies')}>
                    📚 My Strategies
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/settings')}>
                    ⚙️ Settings
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/logout')} className="text-error">
                    🚪 Log Out
                  </button>
                </li>
              </ul>
            </div>

            {/* Mobile Menu */}
            <div className="dropdown dropdown-end md:hidden">
              <button className="btn btn-ghost btn-circle btn-sm">
                ☰
              </button>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <button
                    onClick={() => navigate('/')}
                    className={isActive('/') ? 'active' : ''}
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/explore')}
                    className={isActive('/explore') ? 'active' : ''}
                  >
                    Explore
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/leaderboard')}
                    className={isActive('/leaderboard') ? 'active' : ''}
                  >
                    Leaderboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/strategies')}
                    className={isActive('/strategies') ? 'active' : ''}
                  >
                    My Strategies
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/create-post')}
                    className={isActive('/create-post') ? 'active' : ''}
                  >
                    Share
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/strategy')}>
                    Backtest
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
