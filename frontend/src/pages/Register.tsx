import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, roleHome } from '../utils';
import Button from '../components/Button';
import { AuthHero } from './Login';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={roleHome(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      navigate('/patient', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      <AuthHero />
      <div className="auth-side">
        <div className="auth-card">
          <div className="auth-card__head">
            <h2>Create your patient account</h2>
            <p>Book appointments and access your records online</p>
          </div>
          <form className="stack" onSubmit={(e) => void submit(e)}>
          <label className="form-group">
            <span>Full name</span>
            <input
              className="input"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="form-group">
            <span>Email</span>
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="form-group">
            <span>Phone</span>
            <input
              className="input"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+966…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <div className="form-row">
            <label className="form-group">
              <span>Password</span>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="form-group">
              <span>Confirm password</span>
              <input
                className="input"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          </div>
          {error && <p className="inline-error">{error}</p>}
          <Button type="submit" loading={submitting}>
            Create account
          </Button>
          </form>
          <p className="auth-alt">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
