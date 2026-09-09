import { BackgroundParticles } from '@/components/background-particles'
import { CursorGlow } from '@/components/cursor-glow'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { ValueProposition } from '@/components/value-proposition'
import { Services } from '@/components/services'
import { TechnologyStack } from '@/components/technology-stack'
import { WorkProcess } from '@/components/work-process'
import { PublicSector } from '@/components/public-sector'
import { CTA } from '@/components/cta'
import { ContactForm } from '@/components/contact-form'
import { Footer } from '@/components/footer'

export default function Page() {
  return (
    <>
      {/* Global ambient effects */}
      <BackgroundParticles />
      <CursorGlow />

      {/* Layout */}
      <Header />

      <main>
        <Hero />
        <ValueProposition />
        <Services />
        <TechnologyStack />
        <WorkProcess />
        <PublicSector />
        <CTA />
        <ContactForm />
      </main>

      <Footer />
    </>
  )
}
