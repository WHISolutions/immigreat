import React, { useState } from 'react';
import '../styles/variables.css';
import '../styles/Auth.css';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Appel de la fonction d'authentification
    const success = await onLogin(email, password);
    setLoading(false);
    if (!success) {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">🍁</span>
        </div>
        <h1>Gestion d'Immigration et d'Études au Canada</h1>
        
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Connexion
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Aide
          </button>
        </div>
        
        {isLogin ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </div>
            
            <div className="auth-footer">
              <a href="#forgot-password">Mot de passe oublié?</a>
            </div>
          </form>
        ) : (
          <div className="auth-help">
            <p>Pour obtenir de l'aide concernant votre compte, veuillez contacter l'administrateur système.</p>
            <p>Email: admin@immigration-canada.com</p>
            <p>Téléphone: +1 (123) 456-7890</p>
            <p>Utilisez les identifiants suivants pour tester l'application :</p>
            <ul>
              <li>Administrateur: admin@example.com / password</li>
              <li>Directeur: directeur@example.com / password</li>
              <li><strong>Marie T.</strong> (conseillère): marie@example.com / password</li>
              <li><strong>Sophie M.</strong> (conseillère): sophie@example.com / password</li>
              <li><strong>Julie L.</strong> (conseillère): julie@example.com / password</li>
              <li>Comptable: comptable@example.com / password</li>
              <li>Secrétaire: secretaire@example.com / password</li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="auth-profiles">
        <h3>Profils disponibles</h3>
        <div className="profile-list">
          <div className="profile-item">
            <div className="profile-icon admin">A</div>
            <div className="profile-info">
              <h4>Administrateur</h4>
              <p>Accès complet au système</p>
            </div>
          </div>
          <div className="profile-item">
            <div className="profile-icon director">D</div>
            <div className="profile-info">
              <h4>Directeur</h4>
              <p>Gestion et supervision</p>
            </div>
          </div>
          <div className="profile-item">
            <div className="profile-icon counselor">C</div>
            <div className="profile-info">
              <h4>Conseillère</h4>
              <p>Gestion des clients</p>
            </div>
          </div>
          <div className="profile-item">
            <div className="profile-icon accountant">F</div>
            <div className="profile-info">
              <h4>Comptable</h4>
              <p>Gestion financière</p>
            </div>
          </div>
          <div className="profile-item">
            <div className="profile-icon secretary">S</div>
            <div className="profile-info">
              <h4>Secrétaire</h4>
              <p>Gestion des leads et RDV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
