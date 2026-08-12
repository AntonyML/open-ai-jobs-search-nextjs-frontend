'use client'

/**
 * Shared global styles for legal & info pages (terms, privacy, limits).
 * Extracted so each page doesn't duplicate the <style jsx global> block.
 * `'use client'` is required because styled-jsx is client-only; server
 * components (e.g. /limits) can still render it as a client boundary.
 */
export default function LegalStyles() {
  return (
    <style jsx global>{`
      .prose-legal h2 {
        font-size: 20px;
        font-weight: 600;
        color: #1d1d1f;
        margin-top: 2.5rem;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e2e2e5;
      }
      .prose-legal h3 {
        font-size: 15px;
        font-weight: 600;
        color: #1d1d1f;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
      }
      .prose-legal p {
        font-size: 15px;
        color: #474747;
        line-height: 1.75;
        margin-bottom: 1rem;
      }
      .prose-legal ul {
        margin: 0.75rem 0 1rem 1.25rem;
        list-style: disc;
      }
      .prose-legal li {
        font-size: 15px;
        color: #474747;
        line-height: 1.75;
        margin-bottom: 0.25rem;
      }
      .prose-legal strong {
        color: #1d1d1f;
        font-weight: 600;
      }
      .prose-legal em {
        color: #707070;
        font-style: italic;
      }
      .prose-legal a {
        color: #0066cc;
        text-decoration: underline;
      }
      .prose-legal a:hover {
        color: #004499;
      }
      .limits-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0 1.5rem;
        font-size: 14px;
      }
      .limits-table th {
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #707070;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #d2d2d7;
        background: #fafafa;
      }
      .limits-table td {
        padding: 0.875rem 1rem;
        color: #474747;
        line-height: 1.6;
        border-bottom: 1px solid #e2e2e5;
        vertical-align: top;
      }
      .limits-table td strong {
        color: #1d1d1f;
      }
    `}</style>
  )
}
