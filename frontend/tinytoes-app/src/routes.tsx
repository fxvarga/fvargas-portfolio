import { createBrowserRouter } from 'react-router-dom';
import { RouteGuard } from '@/components/RouteGuard';
import { LandingPage } from '@/features/landing/LandingPage';
import { ClaimPage } from '@/features/claim/ClaimPage';
import { CheckoutSuccessPage } from '@/features/checkout/CheckoutSuccessPage';
import { CheckoutCancelPage } from '@/features/checkout/CheckoutCancelPage';
import { OnboardingLayout } from '@/features/onboarding/OnboardingLayout';
import { HomePage } from '@/features/home/HomePage';
import { MemoryBookPage } from '@/features/memory-book/MemoryBookPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

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
    path: '/memory-book',
    element: (
      <RouteGuard>
        <MemoryBookPage />
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
]);
