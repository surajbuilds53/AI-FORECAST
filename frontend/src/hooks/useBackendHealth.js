import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../api/client';

export function useBackendHealth() {
  const [status, setStatus] = useState({
    healthy: false,
    service: '',
    version: '',
    error: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const refreshHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const data = await checkHealth();
      setStatus({
        healthy: data.status === 'healthy',
        service: data.service || 'FastAPI',
        version: data.version || '0.1.0',
        error: null,
      });
    } catch (err) {
      setStatus({
        healthy: false,
        service: '',
        version: '',
        error: err.message || 'Connection failed',
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  return { status, isChecking, refreshHealth };
}

export default useBackendHealth;
