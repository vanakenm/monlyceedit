import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Lycee } from '../types'
import { lienLycee } from '../router'

const FRANCE: L.LatLngBoundsExpression = [
  [41.3, -5.2],
  [51.1, 9.6],
]

function Cadrage({ points, centre }: { points: [number, number][]; centre?: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (centre) map.setView(centre, 15)
    else if (points.length === 1) map.setView(points[0], 13)
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 13 })
    else map.fitBounds(FRANCE)
  }, [map, points, centre])
  return null
}

interface Props {
  lycees: Lycee[]
  hauteur?: string
  centre?: [number, number]
  surbrillance?: string
}

export function Carte({ lycees, hauteur = 'h-[520px]', centre, surbrillance }: Props) {
  const avecCoords = useMemo(() => lycees.filter((l) => l.lat != null && l.lon != null), [lycees])
  const points = useMemo(() => avecCoords.map((l) => [l.lat!, l.lon!] as [number, number]), [avecCoords])

  return (
    <div className={`${hauteur} w-full border border-gris-bordure`}>
      <MapContainer bounds={FRANCE} preferCanvas className="h-full w-full" scrollWheelZoom={!centre}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Cadrage points={points} centre={centre} />
        {avecCoords.map((l) => {
          const actif = l.id === surbrillance
          return (
            <CircleMarker
              key={l.id}
              center={[l.lat!, l.lon!]}
              radius={actif ? 10 : 6}
              pathOptions={{
                color: '#fff',
                weight: 1.5,
                fillColor: actif ? '#e1000f' : l.statut === 'Privé' ? '#8d1a1a' : '#000091',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <a href={lienLycee(l.id)} className="font-semibold text-bleu">
                  {l.nom}
                </a>
                <br />
                {l.commune} ({l.dep})
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
