import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../api/useAuth';
import { LogOut } from 'lucide-react';

export default function LogoutPage() {
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();

  useEffect(() => {
    logout(undefined, {
      onSuccess: () => {
        // useLogout hook already clears localStorage, just redirect
        setTimeout(() => navigate('/login'), 1500);
      },
      onError: () => {
        // Fallback
        localStorage.removeItem("uid");
        localStorage.removeItem("email");
        localStorage.removeItem("username");
        setTimeout(() => navigate('/login'), 1500);
      },
    });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-center">
        <LogOut className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-2">Logged Out</h1>
        <p className="text-base-content/70 mb-6">See you next time!</p>
        <p className="text-sm text-base-content/60">Redirecting to login...</p>
      </div>
    </div>
  );
}
