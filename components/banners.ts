export interface BannerSlide {
  id: number;
  stem: string;
  alt: string;
  kicker: string;
}

export const HOME_BANNERS: BannerSlide[] = [
  {
    id: 1,
    stem: '/banners/banner-1',
    alt: 'Removalists loading crates onto a moving truck',
    kicker: 'We load the truck',
  },
  {
    id: 2,
    stem: '/banners/banner-2',
    alt: 'Movers packing a van with boxes',
    kicker: 'Vans for the smaller jobs',
  },
  {
    id: 3,
    stem: '/banners/banner-3',
    alt: 'Someone taping a moving box ready for the trip',
    kicker: 'Packed with care',
  },
  {
    id: 4,
    stem: '/banners/banner-4',
    alt: 'A couple packing boxes in their home',
    kicker: 'Your new place, sorted',
  },
];
