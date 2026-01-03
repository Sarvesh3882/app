import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/login', { replace: true });
          return;
        }

        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const user = response.data;
        navigate('/dashboard', { state: { user }, replace: true });
      } catch (error) {
        console.error('Session exchange error:', error);
        navigate('/login', { replace: true });
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-white font-['Press_Start_2P'] text-sm animate-pulse mb-4">
          Processing...
        </div>
        <div className="text-white font-['VT323'] text-xl">Please wait</div>
      </div>
    </div>
  );
}