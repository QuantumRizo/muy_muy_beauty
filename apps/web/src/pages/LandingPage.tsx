import { useState, useEffect } from 'react'
import LandingNavbar from '../components/Landing/LandingNavbar'
import HeroSection from '../components/Landing/HeroSection'
import QuienesSomosSection from '../components/Landing/QuienesSomosSection'
import ServicesSection from '../components/Landing/ServicesSection'
import ProductosSection from '../components/Landing/ProductosSection'
import ContactSection from '../components/Landing/ContactSection'

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ background: '#fff', color: '#1d1d1f', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <LandingNavbar />
      <HeroSection isMobile={isMobile} />
      <QuienesSomosSection isMobile={isMobile} />
      <ServicesSection />
      <ProductosSection isMobile={isMobile} />
      <ContactSection />

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none; }
        }
        * { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}
