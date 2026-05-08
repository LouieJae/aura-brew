import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Origin from "@/components/Origin";
import SignatureBrews from "@/components/SignatureBrews";
import Footer from "@/components/Footer";
import BeanScene from "@/components/BeanScene";

export default function Home() {
  return (
    <main className="relative flex w-full flex-1 flex-col">
      {/* Global fixed 3D layer — the bean travels across sections via ScrollTrigger */}
      <BeanScene />

      <Navbar />
      <Hero />
      <Origin />
      <SignatureBrews />
      <Footer />
    </main>
  );
}
