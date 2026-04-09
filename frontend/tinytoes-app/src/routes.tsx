import { createBrowserRouter } from 'react-router-dom';
import { RouteGuard } from '@/components/RouteGuard';
import { LandingPage } from '@/features/landing/LandingPage';
import { ClaimPage } from '@/features/claim/ClaimPage';
import { CheckoutSuccessPage } from '@/features/checkout/CheckoutSuccessPage';
import { CheckoutCancelPage } from '@/features/checkout/CheckoutCancelPage';
import { OnboardingLayout } from '@/features/onboarding/OnboardingLayout';
import { HomePage } from '@/features/home/HomePage';
import { MilestonesPage } from '@/features/milestones/MilestonesPage';
import { JournalPage } from '@/features/journal/JournalPage';
import { MemoryBookPage } from '@/features/memory-book/MemoryBookPage';
import { YearRecapPage } from '@/features/year-recap/YearRecapPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { StorePage } from '@/features/store/StorePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/claim',
    element: <ClaimPage />,
  },
  {
    path: '/checkout/success',
    element: <CheckoutSuccessPage />,
  },
  {
    path: '/checkout/cancel',
    element: <CheckoutCancelPage />,
  },
  {
    path: '/onboarding',
    element: (
      <RouteGuard>
        <OnboardingLayout />
      </RouteGuard>
    ),
  },
  {
    path: '/home',
    element: (
      <RouteGuard>
        <HomePage />
      </RouteGuard>
    ),
  },
  {
    path: '/milestones',
    element: (
      <RouteGuard>
        <MilestonesPage />
      </RouteGuard>
    ),
  },
  {
    path: '/journal',
    element: (
      <RouteGuard>
        <JournalPage />
      </RouteGuard>
    ),
  },
  {
    path: '/memory-book',
    element: (
      <RouteGuard>
        <MemoryBookPage />
      </RouteGuard>
    ),
  },
  {
    path: '/year-recap',
    element: (
      <RouteGuard>
        <YearRecapPage />
      </RouteGuard>
    ),
  },
  {
    path: '/settings',
    element: (
      <RouteGuard>
        <SettingsPage />
      </RouteGuard>
    ),
  },
  {
    path: '/store',
    element: (
      <RouteGuard>
        <StorePage />
      </RouteGuard>
    ),
  },
]);
