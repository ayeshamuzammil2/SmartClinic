import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, roleHome } from '../utils';
import Button from '../components/Button';
import {
  IconCalendar,
  IconChart,
  IconShield,
  IconSparkle,
  IconStethoscope,
  IconUsers,
  LogoMark,
} from '../components/Icons';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@smartclinic.test', icon: <IconChart size={16} /> },
  { role: 'Receptionist', email: 'reception@smartclinic.test', icon: <IconCalendar size={16} /> },
  { role: 'Doctor', email: 'dr.khan@smartclinic.test', icon: <IconStethoscope size={16} /> },
  { role: 'Patient', email: 'patient@smartclinic.test', icon: <IconUsers size={16} /> },
];

const FEATURES = [
  {
    icon: <IconSparkle size={18} />,
    title: 'AI triage & intake',
    text: 'Patients arrive prepared — doctors see a structured summary.',
  },
  {
    icon: <IconCalendar size={18} />,
    title: 'Smart booking',
    text: 'Symptom-aware specialty recommendations and instant slots.',
  },
  {
    icon: <IconUsers size={18} />,
    title: 'Live queue board',
    text: 'Drag-and-drop rescheduling with no-show risk alerts.',
  },
  {
    icon: <IconShield size={18} />,
    title: 'Insurance tracking',
    text: 'Pre-authorizations followed from request to approval.',
  },
];

export function AuthHero() {
  return (
    <div className="auth-hero">
      <div className="auth-hero__brand">
        <LogoMark size={52} />
        <h1>SmartClinic</h1>
      </div>
      <p className="auth-hero__tagline">
        AI-Augmented Outpatient Care — one platform for patients, doctors, reception and
        administration.
      </p>
      <div className="auth-hero__features">
        {FEATURES.map((f) => (
          <div key={f.title} className="auth-feature">
            <span className="auth-feature__icon">{f.icon}</span>
            <span className="auth-feature__text">
              <strong>{f.title}</strong>
              <span>{f.text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={roleHome(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const me = await login(email.trim(), password);
      navigate(roleHome(me.role), { replace: true });
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
            <h2>Welcome back</h2>
            <p>Sign in to your SmartClinic account</p>
          </div>
          <form className="stack" onSubmit={(e) => void submit(e)}>
            <label className="form-group">
              <span>Email</span>
              <input
                className="input"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="form-group">
              <span>Password</span>
              <input
                className="input"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="inline-error">{error}</p>}
            <Button type="submit" loading={submitting}>
              Sign in
            </Button>
          </form>
          <p className="auth-alt">
            New patient? <Link to="/register">Create an account</Link>
          </p>
          <div className="demo-box">
            <div className="demo-box__title">Demo accounts — click to fill (password: Password1!)</div>
            <div className="role-chips">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  className="role-chip"
                  title={a.email}
                  onClick={() => {
                    setEmail(a.email);
                    setPassword('Password1!');
                  }}
                >
                  {a.icon}
                  {a.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
