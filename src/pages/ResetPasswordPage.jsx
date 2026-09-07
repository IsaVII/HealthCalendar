import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resetPassword } from '@/features/auth/authSlice';
import { selectAuthPending, selectAuthError } from '@/features/auth/authSelectors';
import { MIN_PASSWORD_LENGTH } from '@/features/auth/validation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

/**
 * Reached via the password-reset email link. Supabase parses the recovery
 * token from the URL (detectSessionInUrl) and creates a temporary session,
 * so updateUser({ password }) works here.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pending = useAppSelector(selectAuthPending);
  const serverError = useAppSelector(selectAuthError);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) return setLocalError('auth.errors.weakPassword');
    if (password !== confirm) return setLocalError('auth.errors.passwordMismatch');
    setLocalError(null);
    const result = await dispatch(resetPassword(password));
    if (resetPassword.fulfilled.match(result)) {
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    }
  }

  const errorKey = localError || (serverError && `auth.errors.${serverError.code || 'generic'}`);

  return (
    <AuthLayout
      title={t('auth.resetPassword.title')}
      footer={
        <Link to="/login" className="font-semibold text-brand-700">
          {t('auth.verifyEmail.backToLogin')}
        </Link>
      }
    >
      {done ? (
        <Alert tone="success">{t('auth.resetPassword.done')}</Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorKey && <Alert tone="error">{t(errorKey)}</Alert>}
          <FormField
            label={t('common.password')}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormField
            label={t('common.password')}
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" loading={pending}>
            {t('auth.resetPassword.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
