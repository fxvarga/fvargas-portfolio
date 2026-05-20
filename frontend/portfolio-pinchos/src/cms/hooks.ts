// Re-export CMS hooks with Pinchos-specific types for convenience
import { useEntity, useCollection } from '@fvargas/portfolio-cms-client';
import type {
  SiteConfig,
  Hero,
  Navigation,
  Gallery,
  EventsPage,
  FindUs,
  MorePage,
  Footer,
  MenuCategory,
  MenuItem,
} from './types';

export const useSiteConfig = () => useEntity<SiteConfig>('site-config');
export const useHero = () => useEntity<Hero>('hero');
export const useNavigation = () => useEntity<Navigation>('navigation');
export const useGallery = () => useEntity<Gallery>('gallery');
export const useEventsPage = () => useEntity<EventsPage>('events-page');
export const useFindUs = () => useEntity<FindUs>('find-us');
export const useMorePage = () => useEntity<MorePage>('more-page');
export const useFooter = () => useEntity<Footer>('footer');

export const useMenuCategories = () => useCollection<MenuCategory>('menu-category');
export const useMenuItems = () => useCollection<MenuItem>('menu-item');
