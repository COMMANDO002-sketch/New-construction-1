import { useState } from 'react'

const TABS = [
  { label: 'All', type: null },
  { label: 'For Sale', type: 'sale' },
  { label: 'For Rent', type: 'rent' },
  { label: 'Short Let', type: 'short-let' },
]

const TYPE_LABELS = {
  sale: 'For sale',
  rent: 'For rent',
  'short-let': 'Short let',
}

function PropertyCard({ property }) {
  const image = property.image ?? property.imageUrl
  const title = property.title ?? property.name ?? 'Property'
  const typeLabel = TYPE_LABELS[property.type] ?? property.type

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
      {image ? (
        <img
          className="aspect-[4/3] w-full object-cover"
          src={image}
          alt={property.imageAlt ?? title}
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-neutral-100 text-sm text-neutral-500">
          Image coming soon
        </div>
      )}
      <div className="p-5">
        {typeLabel && (
          <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium capitalize text-neutral-700">
            {typeLabel}
          </span>
        )}
        <h3 className="mt-3 text-lg font-semibold text-neutral-950">{title}</h3>
        {property.location && (
          <p className="mt-1 text-sm text-neutral-600">{property.location}</p>
        )}
        {property.price != null && (
          <p className="mt-4 text-base font-semibold text-neutral-950">{property.price}</p>
        )}
      </div>
    </article>
  )
}

export default function PropertyTabs({ properties = [] }) {
  const [activeTab, setActiveTab] = useState('All')
  const propertyList = Array.isArray(properties) ? properties : []
  const selectedType = TABS.find(({ label }) => label === activeTab)?.type
  const filteredProperties = selectedType
    ? propertyList.filter((property) => property?.type === selectedType)
    : propertyList

  return (
    <section className="bg-white px-5 py-16 text-neutral-900 sm:px-8 sm:py-20 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Find your next place
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Featured properties
          </h2>
        </div>

        <div
          className="mb-8 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible"
          aria-label="Filter properties"
        >
          {TABS.map(({ label }) => {
            const isActive = activeTab === label

            return (
              <button
                key={label}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(label)}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                  isActive
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property, index) => (
              <PropertyCard
                key={property.id ?? `${property.title ?? property.name ?? 'property'}-${index}`}
                property={property}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-neutral-900">No properties to show yet</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Please check back soon for available properties.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
