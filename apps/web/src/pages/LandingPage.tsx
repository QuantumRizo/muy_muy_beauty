import { useState, useEffect } from 'react'
import LandingNavbar from '../components/Landing/LandingNavbar'
import HeroSection from '../components/Landing/HeroSection'
import QuienesSomosSection from '../components/Landing/QuienesSomosSection'
import ServicesSection from '../components/Landing/ServicesSection'
import ProductosSection from '../components/Landing/ProductosSection'
import DownloadAppSection from '../components/Landing/DownloadAppSection'
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
    <div className="landing-editorial" style={{ background: '#fff', color: '#1d1d1f', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <LandingNavbar />
      <HeroSection isMobile={isMobile} />
      <QuienesSomosSection isMobile={isMobile} />
      <ServicesSection />
      <ProductosSection isMobile={isMobile} />
      <DownloadAppSection isMobile={isMobile} />
      <ContactSection />

      <style>{`
        .landing-editorial h1, 
        .landing-editorial h2, 
        .landing-editorial h3 {
          font-family: 'Bodoni Moda', serif !important;
          font-weight: 800;
          letter-spacing: -2px;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .desktop-only { display: none; }
        }
      `}</style>
    </div>
  )
}
