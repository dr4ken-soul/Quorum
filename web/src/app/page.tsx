import Navigation from "@/components/navigation";
import Hero from "@/components/hero";
import Problem from "@/components/problem";
import Trial from "@/components/trial";
import Proof from "@/components/proof";
import Court from "@/components/court";
import Rules from "@/components/rules";
import UseCases from "@/components/use-cases";
import Limits from "@/components/limits";
import Ruling from "@/components/ruling";
import Footer from "@/components/footer";

/** The kinetic editorial landing page. Static content only. */
export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Problem />
      <Trial />
      <Proof />
      <Court />
      <Rules />
      <UseCases />
      <Limits />
      <Ruling />
      <Footer />
    </main>
  );
}
