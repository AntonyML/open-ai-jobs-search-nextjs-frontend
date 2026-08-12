import { useEffect, useState } from 'react'
import * as THREE from 'three'

/**
 * Client-side texture helpers for the marketing 3D scenes.
 *
 * Textures are built from 2D canvas (no network, no shaders) so they render
 * reliably on light backgrounds with NORMAL blending — unlike additive
 * blending, which disappears over white.
 *
 * All `document` access happens inside effects (never during render) to keep
 * React 19 render purity and SSR hydration safe.
 */

/* ------------------------------------------------------------------------- */
/* Soft round sprite                                                         */
/* ------------------------------------------------------------------------- */

let softTextureCache: THREE.Texture | null = null

function buildSoftParticleTexture(): THREE.Texture {
  if (softTextureCache) return softTextureCache
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.28)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  softTextureCache = texture
  return texture
}

/**
 * Build a texture inside an effect (SSR/render-purity safe) and return it
 * once ready — `null` until then (scenes render nothing for one frame).
 */
function useCanvasTexture<T>(build: () => T): T | null {
  const [texture, setTexture] = useState<T | null>(null)
  useEffect(() => {
    setTexture(build())
  }, [build])
  return texture
}

/** Shared soft sprite texture, created inside an effect (SSR-safe). */
export function useSoftParticleTexture(): THREE.Texture | null {
  return useCanvasTexture(buildSoftParticleTexture)
}

/* ------------------------------------------------------------------------- */
/* Rounded "document" mock textures (CV base / adapted CV / cover letter)    */
/* ------------------------------------------------------------------------- */

export type DocumentVariant = 'base' | 'adapted' | 'cover'

const DOC_VARIANTS: Record<DocumentVariant, string> = {
  base: '#0071e3',
  adapted: '#00b8d9',
  cover: '#5ac8fa',
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill
  roundRectPath(ctx, x, y, w, h, r)
  ctx.fill()
}

function buildDocumentTexture(variant: DocumentVariant): THREE.Texture {
  const W = 512
  const H = 640
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const accent = DOC_VARIANTS[variant]

    // Paper card
    ctx.fillStyle = '#ffffff'
    roundRectPath(ctx, 0, 0, W, H, 32)
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#e5e5ea'
    roundRectPath(ctx, 1.5, 1.5, W - 3, H - 3, 31)
    ctx.stroke()

    // Header: accent mark + title lines
    const pad = 44
    const innerW = W - pad * 2
    bar(ctx, pad, 42, 12, 12, 4, accent)
    bar(ctx, pad + 26, 42, innerW * 0.5, 12, 6, '#1d1d1f')
    bar(ctx, pad, 66, innerW * 0.34, 8, 4, '#9a9aa0')

    if (variant === 'cover') {
      // Greeting + shorter body + signature
      bar(ctx, pad, 118, innerW * 0.5, 9, 4.5, '#707070')
      const coverLines = [innerW, innerW * 0.94, innerW * 0.82, innerW * 0.96, innerW * 0.6]
      let y = 156
      for (const w of coverLines) {
        bar(ctx, pad, y, w, 9, 4.5, '#c9c9ce')
        y += 20
      }
      ctx.strokeStyle = accent
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(pad + 26, 330)
      ctx.bezierCurveTo(pad + 70, 296, pad + 96, 342, pad + 136, 318)
      ctx.stroke()
    } else if (variant === 'adapted') {
      // Highlighted paragraph (the AI-adapted section)
      bar(ctx, pad, 118, innerW, 56, 10, 'rgba(0,113,227,0.09)')
      bar(ctx, pad + 16, 134, innerW * 0.84, 8, 4, '#a8c8f5')
      bar(ctx, pad + 16, 150, innerW * 0.74, 8, 4, '#a8c8f5')
      const adaptedLines = [innerW, innerW * 0.9, innerW * 0.96, innerW * 0.55]
      let y = 218
      for (const w of adaptedLines) {
        bar(ctx, pad, y, w, 9, 4.5, '#c9c9ce')
        y += 20
      }
      bar(ctx, pad, y + 6, innerW * 0.42, 9, 4.5, '#c9c9ce')
    } else {
      // Dense base CV
      const baseLines = [innerW, innerW * 0.92, innerW * 0.97, innerW * 0.58, innerW, innerW * 0.86, innerW * 0.94, innerW * 0.46]
      let y = 124
      for (const w of baseLines) {
        bar(ctx, pad, y, w, 9, 4.5, '#c9c9ce')
        y += 20
      }
      bar(ctx, pad, y + 8, innerW * 0.5, 12, 6, '#9a9aa0')
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/** The three document textures (base CV → adapted CV → cover letter). */
export function useDocumentTextures(): THREE.Texture[] | null {
  return useCanvasTexture(() => {
    const variants: DocumentVariant[] = ['base', 'adapted', 'cover']
    return variants.map(buildDocumentTexture)
  })
}
