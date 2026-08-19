# CHANGELOG

All notable changes to the CVMeld frontend project are documented in this file.

## [Unreleased]

### Added
- **Mobile App Launcher**: nuevo launcher móvil (`components/navigation/MobileAppLauncher.tsx`) que reemplaza el menú legacy en el contexto autenticado: Sheet a pantalla completa con cabecera contextual (logo ⇄ carpeta), carpetas por sección configurada desde `NAV_SECTIONS` (Documentos, Búsqueda de empleo, Cuenta, Admin), card destacada al Dashboard, badge "Plan Max" en ítems bloqueados y cierre de sesión.
- **MobileNavigationProvider**: contexto global `{ available, launcherOpen, openLauncher, closeLauncher }` montado en el layout autenticado; cierra el launcher al navegar.
- **useResolvedNav**: hook central (`components/navigation/use-resolved-nav.ts`) que resuelve `NAV_SECTIONS` aplicando locking/tier/adminOnly — fuente única compartida por sidebar, launcher y QuickActions.
- **QuickActions**: sección del Home móvil (`components/dashboard/QuickActions.tsx`) con acciones rápidas (crear CV, buscar empleos, adaptar CV, entrevistas) y estados bloqueados desde la misma config del sidebar.
- **Dashboard móvil**: el dashboard actúa como Home en móvil (via CSS order): resumen → acciones rápidas → embudo → CV → progreso → actividad; el orden desktop se conserva con `md:order-*`.
- **prefers-reduced-motion**: media query nativa (CSS global) que desactiva animaciones/transiciones en dispositivos con preferencia reducida; el launcher usa `animate-launcher-enter`.

### Changed
- **Navbar**: la hamburguesa del layout autenticado abre el App Launcher (target táctil 44px, `aria-expanded`, `aria-label` localizado); en marketing/sin sesión conserva el dropdown legacy.
- **AppSidebar**: consume `useResolvedNav`; corregido el active-state cuando la ruta incluye prefijo de locale (`stripLocale`).
- **Traducciones**: nueva sección `appNav` y clave `nav.appMenu` en `messages/es.json` y `messages/en.json`.
- **SidebarLinkItem**: descripciones de ítem aumentadas de 10px a 12px para legibilidad.

### Fixed
- **Active state con locale**: la sidebar no marcaba el ítem activo en rutas con prefijo (`/es/dashboard`).

### Changed
- **Rebrand a CVMeld**: eliminadas todas las referencias a "Open Ai Jobs Search" en la UI, mensajes, manifest, SEO y documentos legales.
- **Términos de Servicio ampliados**: se añadieron cláusulas de arbitraje, renuncia a acción de clase, fuerza mayor, limitación de responsabilidad reforzada, contenido IA, ofertas de terceros y disposiciones generales.
- **Política de Privacidad ampliada**: minimización de datos, usuarios fuera de Costa Rica (RGPD/CCPA), transferencias internacionales y retención detallada.

### Fixed
- **Logo SVG Size**: Corrected logo size from 18px to responsive 32px (`md:w-9 md:h-9`) in Navbar for optimal visual hierarchy and enterprise standards.
- **Duplicate Brand Text**: Removed duplicated text string `"Open Ai Jobs Search"` in Navbar link to avoid visual and DOM redundancy.
- **Optional SVG Background**: Updated `Logo` component to make the background `<rect>` optional (`showBackground={false}` by default), rendering a pure transparent vector SVG without unnecessary background boxes.
- **UX & Accessibility**: Enhanced logo hover micro-interaction, contrast, and clean layout compliance across desktop and mobile headers.
- **Performance**: Reduced unnecessary DOM nodes by removing redundant text elements next to logo components.
