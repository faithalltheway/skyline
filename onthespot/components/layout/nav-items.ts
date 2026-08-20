export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/map", label: "Map", icon: "map" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/rsvps", label: "My RSVPs", icon: "check" },
  { href: "/events/create", label: "Create Event", icon: "plus" },
  { href: "/messages", label: "Messages", icon: "message" },
  { href: "/people", label: "People", icon: "users" },
  { href: "/profile", label: "Profile", icon: "user" },
];

// Bottom nav on mobile has limited space — trim to the five most-used destinations.
export const MOBILE_NAV: NavItem[] = [
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/map", label: "Map", icon: "map" },
  { href: "/events/create", label: "Create", icon: "plus" },
  { href: "/rsvps", label: "RSVPs", icon: "check" },
  { href: "/profile", label: "Profile", icon: "user" },
];
