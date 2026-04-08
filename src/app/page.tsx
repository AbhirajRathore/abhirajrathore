import Hero from "@/components/Hero";
import LaptopTransition from "@/components/LaptopTransition";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";

export default function Home() {
  return (
    <main>
      <Hero />
      <LaptopTransition />
      <About />
      <Experience />
      <Projects />
      <Skills />
    </main>
  );
}
