import { useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { Input } from '../components/Input';
import { LoadingState } from '../components/LoadingState';
import { AuthApiError, login, register, saveAuthSession } from '../services/auth';

interface AuthPageProps {
  mode: 'register' | 'login';
  onNavigate: (href: string) => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

const initialValues: FormValues = { name: '', email: '', password: '' };

function validate(values: FormValues, mode: AuthPageProps['mode']): FormErrors {
  const errors: FormErrors = {};
  if (mode === 'register' && values.name.trim().length < 2) {
    errors.name = 'Enter your name so we can personalize your journey.';
  }
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters for your password.';
  }
  return errors;
}

export function AuthPage({ mode, onNavigate, onSuccess }: AuthPageProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const sessionExpired =
    !isRegister && new URLSearchParams(window.location.search).get('reason') === 'session-expired';
  const title = isRegister ? 'Create your Pathfinder account' : 'Welcome back';
  const description = isRegister
    ? 'Start with a few details. Your account will become the home for your career discovery journey.'
    : 'Sign in to continue your assessment, roadmap, advisor conversation, and VR exploration.';

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values, mode);
    setErrors(nextErrors);
    setServerError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const session = isRegister
        ? await register({
            name: values.name.trim(),
            email: values.email.trim(),
            password: values.password,
          })
        : await login({ email: values.email.trim(), password: values.password });
      saveAuthSession(session);
      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof AuthApiError
          ? error.message
          : 'We could not complete that request. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page" aria-labelledby="auth-page-title">
      <div className="auth-page__intro">
        <p className="eyebrow">{isRegister ? 'Begin your journey' : 'Continue your journey'}</p>
        <h1 id="auth-page-title">{title}</h1>
        <p>{description}</p>
      </div>
      <div className="auth-page__panel">
        {sessionExpired && (
          <div className="auth-page__notice" role="status">
            <strong>Your session has ended.</strong>
            <span>For your security, please sign in again to continue.</span>
          </div>
        )}
        {serverError && (
          <ErrorState
            title={isRegister ? 'We could not create your account' : 'We could not sign you in'}
            description={serverError}
          />
        )}
        {isSubmitting ? (
          <LoadingState
            label={isRegister ? 'Creating your account' : 'Signing you in'}
            description={
              isRegister
                ? 'Creating your secure Pathfinder session.'
                : 'Connecting securely to Pathfinder. This should only take a few seconds.'
            }
          />
        ) : (
          <form className="auth-form" noValidate onSubmit={handleSubmit}>
            {isRegister && (
              <Input
                autoComplete="name"
                error={errors.name}
                label="Full name"
                name="name"
                onChange={(event) => updateValue('name', event.target.value)}
                value={values.name}
              />
            )}
            <Input
              autoComplete="email"
              error={errors.email}
              label="Email address"
              name="email"
              onChange={(event) => updateValue('email', event.target.value)}
              type="email"
              value={values.email}
            />
            <Input
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              error={errors.password}
              hint="At least 8 characters."
              label="Password"
              name="password"
              onChange={(event) => updateValue('password', event.target.value)}
              type="password"
              value={values.password}
            />
            <Button fullWidth size="large" type="submit">
              {isRegister ? 'Create account' : 'Sign in'} <span aria-hidden="true">↗</span>
            </Button>
          </form>
        )}
        <p className="auth-page__switch">
          {isRegister ? 'Already have an account?' : 'New to Pathfinder?'}{' '}
          <button
            className="text-link text-link--button"
            type="button"
            onClick={() => onNavigate(isRegister ? '/login' : '/register')}
          >
            {isRegister ? 'Sign in' : 'Create an account'} <span aria-hidden="true">↗</span>
          </button>
        </p>
      </div>
    </section>
  );
}
