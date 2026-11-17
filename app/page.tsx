import TutorHero from "@/components/TutorHero";
import CoursesSection from "@/components/CoursesSection";
import BookingWizard from "@/components/BookingWizard";

export default function Home() {
  return (
    <div className="space-y-12">
      <TutorHero />
      <CoursesSection />
      <BookingWizard />
    </div>
  );
}
