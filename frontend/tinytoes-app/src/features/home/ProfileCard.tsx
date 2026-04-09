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
        <div
          className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xl"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span role="img" aria-label="baby">&#x1F476;</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>
            {profile.name}'s Journal
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {profile.ageRange}
          </p>
        </div>
      </div>
    </Card>
  );
}
