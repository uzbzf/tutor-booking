import { Suspense } from "react";
import TutorHero from "@/components/TutorHero";
import CoursesSection from "@/components/CoursesSection";
import BookingWizard from "@/components/BookingWizard";
import PaymentSuccessBanner from "@/components/PaymentSuccessBanner";

export default function Home() {
  return (
    <div className="space-y-12">
      <Suspense fallback={null}>
        <PaymentSuccessBanner />
      </Suspense>
      <TutorHero />
      <CoursesSection />
      <BookingWizard />
    </div>
  );
}
