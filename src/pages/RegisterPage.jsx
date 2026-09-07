import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { registerUser } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthPending } from '@/features/auth/authSelectors';
import { validateRegistration } from '@/features/auth/validation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function RegisterPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pending = useAppSelector(selectAuthPending);
  const serverError = useAppSelector(selectAuthError);

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validateRegistration(form);
    if (problem) {
      setLocalError(problem);
      return;
    }
    setLocalError(null);
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) {
      navigate('/verify-email', { state: { email: form.email } });
    }
  }

  const errorKey = localError || (serverError && `auth.errors.${serverError.code || 'generic'}`);

  return (
    <AuthLayout
      title={t('auth.register.title')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            {t('auth.register.loginLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errorKey && <Alert tone="error">{t(errorKey)}</Alert>}

        <FormField
          label={t('common.username')}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          hint={t('auth.register.usernameHint')}
          required
          value={form.username}
          onChange={update('username')}
        />
        <FormField
          label={t('common.email')}
          type="email"
          name="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          value={form.email}
          onChange={update('email')}
        />
        <FormField
          label={t('common.password')}
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update('password')}
        />
        <FormField
          label={t('common.password')}
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={update('confirm')}
        />

        <Button type="submit" loading={pending}>
          {t('auth.register.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
