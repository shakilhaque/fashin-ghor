import { ProfileForm } from '@/components/account/profile-form';
import { PasswordForm } from '@/components/account/password-form';

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
