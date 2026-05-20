// Pinchos Lounge CMS types — matches entity definitions in backend migration
// _20260516000001_PinchosEntityDefinitionsAndContent.cs

export interface SiteConfig {
  restaurantName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  hours: HoursEntry[];
  socialLinks: SocialLink[];
}

export interface HoursEntry {
  days: string;
  time: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Navigation {
  items: NavItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface Hero {
  preTitle: string;
  title: string;
  subTitle: string;
  caption: string;
  ctaMenuLabel: string;
  bgImageDesktop: string;
  bgImageMobile: string;
  addressLine: string;
}

export interface MenuCategory {
  name: string;
  slug: string;
  sortOrder: number;
}

export interface MenuItem {
  name: string;
  price: string;
  description: string;
  image: string;
  tag: string;
  categorySlug: string;
  sortOrder: number;
}

export interface Gallery {
  categories: string[];
  images: GalleryImage[];
}

export interface GalleryImage {
  src: string;
  alt: string;
  category: string;
}

export interface EventsPage {
  heading: string;
  scriptLine: string;
  description: string;
  services: EventService[];
  collageImages: CollageImage[];
  ctaLabel: string;
  ctaEmail: string;
}

export interface EventService {
  icon: string;
  label: string;
  desc: string;
}

export interface CollageImage {
  src: string;
  alt: string;
}

export interface FindUs {
  locationImage: string;
  restaurantName: string;
  addressLines: string;
  hours: HoursEntry[];
  phone: string;
  mapsUrl: string;
}

export interface MorePage {
  aboutImage: string;
  aboutText: string;
  links: MoreLink[];
  socialLinks: MoreSocialLink[];
}

export interface MoreLink {
  label: string;
  icon: string;
  href: string;
}

export interface MoreSocialLink {
  platform: string;
  url: string;
}

export interface Footer {
  copyright: string;
  tagline: string;
}
