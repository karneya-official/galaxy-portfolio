import { lazy, Suspense } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Approach from './components/Approach';
import Contact from './components/Contact';
import Footer from './components/Footer';

// The background is loaded as a separate chunk so the text content can paint first.
const CosmicOcean = lazy(() => import('./scene/CosmicOcean'));

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Suspense fallback={<div className="ocean"><div className="ocean-fallback" aria-hidden="true" /></div>}>
        <CosmicOcean />
      </Suspense>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Approach />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
