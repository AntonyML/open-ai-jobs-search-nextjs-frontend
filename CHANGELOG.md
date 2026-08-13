# CHANGELOG

All notable changes to the Open AI Jobs Search Next.js frontend project are documented in this file.

## [Unreleased]

### Fixed
- **Logo SVG Size**: Corrected logo size from 18px to responsive 32px (`md:w-9 md:h-9`) in Navbar for optimal visual hierarchy and enterprise standards.
- **Duplicate Brand Text**: Removed duplicated text string `"Open Ai Jobs Search"` in Navbar link to avoid visual and DOM redundancy.
- **Optional SVG Background**: Updated `Logo` component to make the background `<rect>` optional (`showBackground={false}` by default), rendering a pure transparent vector SVG without unnecessary background boxes.
- **UX & Accessibility**: Enhanced logo hover micro-interaction, contrast, and clean layout compliance across desktop and mobile headers.
- **Performance**: Reduced unnecessary DOM nodes by removing redundant text elements next to logo components.
