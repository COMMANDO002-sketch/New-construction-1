import staircaseImage from '../assets/staircase-interior.jpg'
import constructionImage from '../assets/house-construction.jpg'
import kitchenImage from '../assets/kitchen-interior.jpg'
import exteriorImage from '../assets/property-home.png'

const PHOTOS = [
  {
    src: staircaseImage,
    alt: 'Finished interior with a staircase and glass balustrade',
    caption: 'Residential staircase and entry',
  },
  {
    src: constructionImage,
    alt: 'Two-storey house under construction',
    caption: 'Residential construction in progress',
  },
  {
    src: kitchenImage,
    alt: 'Fitted kitchen with white cabinets and stone flooring',
    caption: 'Fitted kitchen interior',
  },
  {
    src: exteriorImage,
    alt: 'Modern two-storey house under construction',
    caption: 'House exterior and site works',
  },
]

export default function SitePhoto({
  imageIndex = 0,
  className = '',
  showCaption = true,
  src,
  alt,
  caption,
}) {
  const photo = PHOTOS[((imageIndex % PHOTOS.length) + PHOTOS.length) % PHOTOS.length]

  return (
    <figure className={`site-photo-figure ${className}`.trim()}>
      <img src={src ?? photo.src} alt={alt ?? photo.alt} loading="lazy" />
      {showCaption && (
        <figcaption>
          <strong>{caption ?? photo.caption}</strong>
        </figcaption>
      )}
    </figure>
  )
}
