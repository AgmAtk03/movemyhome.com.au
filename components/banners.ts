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
    alt: 'My Home Removals truck at a Sydney home, two movers loading a fridge',
    kicker: 'We load the truck',
  },
  {
    id: 2,
    stem: '/banners/banner-2',
    alt: 'A My Home removalist sliding a fridge into a van',
    kicker: 'Vans for the smaller jobs',
  },
  {
    id: 3,
    stem: '/banners/banner-3',
    alt: 'A customer packing clothes while a My Home mover carries branded boxes',
    kicker: 'Packed with care',
  },
  {
    id: 4,
    stem: '/banners/banner-4',
    alt: 'A couple packing clothes into boxes in their new place',
    kicker: 'Your new place, sorted',
  },
];
