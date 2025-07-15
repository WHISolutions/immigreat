import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import useAutoLogout from '../hooks/useAutoLogout';

// Mock component pour tester le hook
const TestComponent = ({ timeout, warningTime, onLogout }) => {
  const { showWarning, continueSession, forceLogout, setAuthenticationStatus } = useAutoLogout(
    timeout,
    onLogout,
    warningTime
  );

  React.useEffect(() => {
    // Marquer comme authentifié au démarrage
    setAuthenticationStatus(true);
  }, [setAuthenticationStatus]);

  return (
    <div>
      <div data-testid="warning-status">{showWarning ? 'warning-shown' : 'no-warning'}</div>
      <button onClick={continueSession} data-testid="continue-btn">
        Continue Session
      </button>
      <button onClick={forceLogout} data-testid="logout-btn">
        Force Logout
      </button>
      <button onClick={() => setAuthenticationStatus(false)} data-testid="disconnect-btn">
        Disconnect
      </button>
    </div>
  );
};

describe('useAutoLogout Hook', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should show warning after specified timeout', async () => {
    const mockLogout = jest.fn();
    const timeout = 5000; // 5 secondes pour le test
    const warningTime = 2; // 2 secondes d'avertissement

    render(
      <TestComponent 
        timeout={timeout} 
        warningTime={warningTime} 
        onLogout={mockLogout} 
      />
    );

    // Initialement, pas d'avertissement
    expect(screen.getByTestId('warning-status')).toHaveTextContent('no-warning');

    // Avancer le temps jusqu'à l'avertissement (timeout - warningTime * 1000)
    jest.advanceTimersByTime(3000); // 5000 - 2000 = 3000ms

    await waitFor(() => {
      expect(screen.getByTestId('warning-status')).toHaveTextContent('warning-shown');
    });

    // L'utilisateur n'a pas encore été déconnecté
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test('should call logout after full timeout', async () => {
    const mockLogout = jest.fn();
    const timeout = 3000; // 3 secondes
    const warningTime = 1; // 1 seconde

    render(
      <TestComponent 
        timeout={timeout} 
        warningTime={warningTime} 
        onLogout={mockLogout} 
      />
    );

    // Avancer le temps jusqu'à la déconnexion complète
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  test('should reset timer on continue session', async () => {
    const mockLogout = jest.fn();
    const timeout = 5000;
    const warningTime = 2;

    render(
      <TestComponent 
        timeout={timeout} 
        warningTime={warningTime} 
        onLogout={mockLogout} 
      />
    );

    // Avancer jusqu'à l'avertissement
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.getByTestId('warning-status')).toHaveTextContent('warning-shown');
    });

    // Cliquer sur continuer
    fireEvent.click(screen.getByTestId('continue-btn'));

    // L'avertissement devrait disparaître
    await waitFor(() => {
      expect(screen.getByTestId('warning-status')).toHaveTextContent('no-warning');
    });

    // Même après le temps initial, l'utilisateur ne devrait pas être déconnecté
    jest.advanceTimersByTime(2000);
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test('should not start timer when not authenticated', async () => {
    const mockLogout = jest.fn();
    const timeout = 2000;
    const warningTime = 1;

    render(
      <TestComponent 
        timeout={timeout} 
        warningTime={warningTime} 
        onLogout={mockLogout} 
      />
    );

    // Déconnecter immédiatement
    fireEvent.click(screen.getByTestId('disconnect-btn'));

    // Avancer le temps
    jest.advanceTimersByTime(3000);

    // Aucun avertissement ne devrait apparaître
    expect(screen.getByTestId('warning-status')).toHaveTextContent('no-warning');
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

export default TestComponent;
