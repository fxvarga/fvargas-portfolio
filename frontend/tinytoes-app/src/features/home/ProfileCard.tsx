import { Baby } from 'lucide-react';
import { Card } from '@/components/Card';
import type { BabyProfile } from '@/types';

interface ProfileCardProps {
  profile: BabyProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xl bg-theme-primary-light">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Baby size={24} className="text-theme-primary" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate text-theme-text">
            {profile.name}'s Journal
          </h2>
          <p className="text-sm text-theme-muted">
            {profile.ageRange}
          </p>
        </div>
      </div>
    </Card>
  );
}
