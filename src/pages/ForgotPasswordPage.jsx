import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { requestPasswordReset } from '@/features/auth/authSlice';
import { selectAuthPending } from '@/features/auth/authSelectors';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const pending = useAppSelector(selectAuthPending);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    // Always show the same message regardless of outcome (no account enumeration).
    await dispatch(requestPasswordReset(email));
    setSent(true);
  }

  return (
    <AuthLayout
      title={t('auth.forgotPassword.title')}
      footer={
        <Link to="/login" className="font-semibold text-brand-700">
          {t('auth.verifyEmail.backToLogin')}
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success">{t('auth.forgotPassword.sent')}</Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-sm text-slate-600">{t('auth.forgotPassword.body')}</p>
          <FormField
            label={t('common.email')}
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={pending}>
            {t('auth.forgotPassword.submit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
