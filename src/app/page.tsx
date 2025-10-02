import Hero from "@/components/Hero";
import ApplicationForm from "@/components/forms/ApplicationForm";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import Reviews from "@/components/reviews/Reviews";
import Contacts from "@/components/Contacts";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <ApplicationForm />
      <Services />
      <section id="gallery" className="container-px py-12 sm:py-16">
        <Gallery />
      </section>
      <section id="reviews" className="container-px py-12 sm:py-16">
        <Reviews />
      </section>
      <Contacts />
    </div>
  );
}
