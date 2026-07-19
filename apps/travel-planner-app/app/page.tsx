import { TravelCalendar } from '@/components/travel/TravelCalendar';

export default function Page() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_32%),radial-gradient(circle_at_90%_18%,rgba(245,158,11,0.08),transparent_24%)]">
      <div className="mx-auto max-w-[1480px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <TravelCalendar />
      </div>
    </main>
  );
}
