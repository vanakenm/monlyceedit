import { useEffect, useState } from 'react'

export type Route = { page: 'accueil' } | { page: 'lycee'; id: string } | { page: 'citations' } | { page: 'apropos' }

function lire(): Route {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [seg, arg] = h.split('/')
  if (seg === 'lycee' && arg) return { page: 'lycee', id: decodeURIComponent(arg) }
  if (seg === 'citations') return { page: 'citations' }
  if (seg === 'a-propos') return { page: 'apropos' }
  return { page: 'accueil' }
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(lire)
  useEffect(() => {
    const onChange = () => setRoute(lire())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export const lienLycee = (id: string) => `#/lycee/${encodeURIComponent(id)}`
