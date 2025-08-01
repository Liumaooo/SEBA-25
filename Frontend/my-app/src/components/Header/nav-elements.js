export const NAV = [
  { label: "Products", to: "/products", show: "guestOnly" },
  { label: "Community", to: "/forum", show: ["buyer", "seller"] },
  { label: "Products", to: "/buyersubscription", show: ["buyer"] },
  { label: "Products", to: "/sellersubscription", show: ["seller"] },
  { label: "Products", to: "/products", show: ["guestOnly"] },
  { label: "Preferences", to: "/preferences", show: ["buyer"] },
  { label: "Matchmaking", to: "/matchmaking", show: ["buyer"] },
  { label: "Watchlist", to: "/watchlist", show: ["buyer"] },
  { label: "Dashboard", to: "/sellerdashboard", show: ["seller"] },
  { label: "Manage Adoptions", to: "/listings", show: ["seller"] },
];