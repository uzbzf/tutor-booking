import TutorHero from "@/components/TutorHero";
import BookingWizard from "@/components/BookingWizard";

export default function Home() {
  return (
    <div className="space-y-8">
      <TutorHero />
      <BookingWizard />
    </div>
  );
}
