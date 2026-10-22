import { TravelCalendar } from '@/components/travel/TravelCalendar';

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1480px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <TravelCalendar />
      </div>
    </main>
  );
}
