import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resendVerification } from '@/features/auth/authSlice';
import { selectAuthUser, selectAuthPending } from '@/features/auth/authSelectors';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const user = useAppSelector(selectAuthUser);
  const pending = useAppSelector(selectAuthPending);

  const email = location.state?.email || user?.email || '';
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (!email) return;
    const result = await dispatch(resendVerification(email));
    if (resendVerification.fulfilled.match(result)) setResent(true);
  }

  return (
    <AuthLayout
      title={t('auth.verifyEmail.title')}
      footer={
        <Link to="/login" className="font-semibold text-brand-700">
          {t('auth.verifyEmail.backToLogin')}
        </Link>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-content-muted">{t('auth.verifyEmail.body', { email })}</p>
        {resent && <Alert tone="success">{t('auth.verifyEmail.resent')}</Alert>}
        <Button variant="secondary" loading={pending} disabled={!email} onClick={handleResend}>
          {t('auth.verifyEmail.resend')}
        </Button>
      </div>
    </AuthLayout>
  );
}
