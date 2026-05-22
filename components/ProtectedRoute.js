import { useEffect } from 'react';
import useUser from '../lib/useUser';

export default function ProtectedRoute({ children }) {
  const user = useUser();

  useEffect(() => {
    if (user === null) {
      // ainda carregando
    }
  }, [user]);

  if (!user) return <p style={{ color: '#fff' }}>Carregando...</p>;

  return children;
}
