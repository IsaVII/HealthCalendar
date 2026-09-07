import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginUser } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthPending } from '@/features/auth/authSelectors';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pending = useAppSelector(selectAuthPending);
  const error = useAppSelector(selectAuthError);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await dispatch(loginUser({ identifier, password }));
    if (loginUser.fulfilled.match(result)) {
      const to = location.state?.from?.pathname || '/dashboard';
      navigate(to, { replace: true });
    } else if (result.payload?.code === 'emailNotConfirmed') {
      navigate('/verify-email');
    }
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-700">
            {t('auth.login.registerLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert tone="error">{t(`auth.errors.${error.code || 'generic'}`)}</Alert>}

        <FormField
          label={t('auth.login.identifierLabel')}
          name="identifier"
          autoComplete="username"
          autoCapitalize="none"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <FormField
          label={t('common.password')}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" loading={pending}>
          {t('auth.login.submit')}
        </Button>

        <div className="text-center">
          <Link to="/forgot-password" className="text-sm text-brand-700">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
