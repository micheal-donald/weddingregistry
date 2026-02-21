import { Calendar, MapPin, Users } from 'lucide-react';
import { useRegistry } from '../contexts/RegistryContext';

export default function HeroSection({ totalItems, reservedItems }) {
  const { registry } = useRegistry();
  if (!registry) return null;

  const eventDate = registry.eventDate
    ? new Date(registry.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          {registry.heroHeading}
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {registry.heroSubheading}
        </p>

        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-700 mb-12">
          {eventDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
              <span>{eventDate}</span>
            </div>
          )}
          {registry.eventLocation && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[var(--color-primary)]" />
              <span>{registry.eventLocation}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[var(--color-primary)]" />
            <span>{reservedItems} of {totalItems} gifts reserved</span>
          </div>
        </div>
      </div>
    </section>
  );
}
