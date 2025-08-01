# FreshNest Landing Page

A modern, responsive React landing page for **FreshNest** (Smart Grocery Warehouse), styled with TailwindCSS. The design is clean, fresh, and food-warehouse-focused, using white and green as primary colors.

## Folder Structure

```
src/
  components/
    AboutSection.jsx
    Footer.jsx
    LandingPage.jsx
    Login.jsx
    Navbar.jsx
    OrderSection.jsx
    StorySection.jsx
  App.jsx
  main.jsx
  index.css
```

## Pages & Components

- **LandingPage.jsx**: Hero section with background image, tagline, CTA, and Navbar (Contact, Login).
- **AboutSection.jsx**: Heading, description, and "Our Story" button.
- **OrderSection.jsx**: 3 feature cards with images and descriptions.
- **StorySection.jsx**: Statement and "Get in touch" button.
- **Footer.jsx**: Three columns (quality, contact, address).
- **Login.jsx**: Tabbed Sign In/Sign Up, email validation, Google sign-in, image background.
- **Navbar.jsx**: Fixed, sticky top, links to sections and login.

## Routing

- Uses `react-router-dom` for navigation between `/` (LandingPage) and `/login` (Login).
- Scroll navigation for About, Story, and Order sections.

## Styling

- TailwindCSS utility classes throughout.
- Responsive for mobile and desktop.
- Fixed, sticky navbar.

## Images

- Use provided Pexels image links for feature cards.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Edit components in `src/components/` as needed.

---

**Ready for implementation!**
