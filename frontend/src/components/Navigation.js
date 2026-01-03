import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setUser(response.data);
      } catch (error) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-black border-b-4 border-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3" data-testid="nav-logo">
            <img
              src="https://customer-assets.emergentagent.com/job_836eb7ab-8a25-41b0-accb-56e6c23944fe/artifacts/2oeof37e_Untitled%20design.png"
              alt="Pixel Coders Logo"
              className="h-12 w-12 pixelated"
            />
            <span className="text-white font-['Press_Start_2P'] text-xs md:text-sm hidden sm:block">
              Pixel Coders
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" label="Home" />
            <NavLink to="/explore" label="Explore" />
            <NavLink to="/playground" label="Playground" />
            <NavLink to="/coming-soon" label="Coming Soon" />
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 border-2 border-white hover:bg-white hover:text-black transition-all duration-0"
                  data-testid="nav-dashboard-link"
                >
                  <User className="w-4 h-4" />
                  <span className="font-['VT323'] text-lg">Level {user.level}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border-2 border-white hover:bg-white hover:text-black transition-all duration-0"
                  data-testid="nav-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 font-['VT323'] text-lg border-2 border-white hover:bg-white hover:text-black transition-all duration-0"
                  data-testid="nav-login-link"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 font-['Press_Start_2P'] text-xs bg-white text-black hover:bg-black hover:text-white border-2 border-white transition-all duration-0"
                  data-testid="nav-register-link"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-toggle"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t-2 border-white py-4" data-testid="mobile-menu">
            <div className="flex flex-col space-y-3">
              <MobileNavLink to="/" label="Home" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/explore" label="Explore" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/playground" label="Playground" onClick={() => setIsOpen(false)} />
              <MobileNavLink to="/coming-soon" label="Coming Soon" onClick={() => setIsOpen(false)} />
              {user ? (
                <>
                  <MobileNavLink to="/dashboard" label="Dashboard" onClick={() => setIsOpen(false)} />
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="text-left px-4 py-2 text-white hover:bg-white hover:text-black border-2 border-white font-['VT323'] text-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink to="/login" label="Login" onClick={() => setIsOpen(false)} />
                  <MobileNavLink to="/register" label="Sign Up" onClick={() => setIsOpen(false)} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, label }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 text-white hover:bg-white hover:text-black font-['VT323'] text-lg transition-all duration-0 border-2 border-transparent hover:border-white"
      data-testid={`nav-${label.toLowerCase()}-link`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="px-4 py-2 text-white hover:bg-white hover:text-black border-2 border-white font-['VT323'] text-lg"
    >
      {label}
    </Link>
  );
}