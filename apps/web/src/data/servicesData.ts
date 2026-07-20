export interface Service {
  id: string
  nombre: string
  precio: string
  duracion_slots: number
}

export interface FamilyData {
  id: string
  name: string
  slug: string
  image: string
  description: string
  services: Service[]
}

export const FAMILIES_DATA: FamilyData[] = [
  {
    id: 'esmaltado-permanente',
    name: 'Esmaltado Permanente',
    slug: 'esmaltado-permanente',
    image: '/esmaltado permanente_compressed.webp',
    description: 'Nuestra especialidad en color de larga duración. Garantizamos un acabado brillante y resistente que respeta la salud de tu uña natural. Ideal para quienes buscan perfección y durabilidad diaria.',
    services: [
      { id: '1adf6cb4-75d3-466a-a875-70cca16866f2', nombre: 'ESMALTADO RUBBER', precio: '450.00', duracion_slots: 4 },
      { id: 'adaa7a68-5e03-4174-b6b3-05cb5472b518', nombre: 'ESMALTADO EN GEL', precio: '280.00', duracion_slots: 2 },
    ]
  },
  {
    id: 'unas-esculpidas',
    name: 'Uñas Esculpidas',
    slug: 'unas-esculpidas',
    image: '/unas esculpidas_compressed.webp',
    description: 'Transforma tus manos con nuestras técnicas de esculpido en gel. Desde extensiones naturales hasta estructuras vanguardistas, diseñadas para durar y deslumbrar.',
    services: [
      { id: '1bba88dc-c891-483a-a367-c683bdf4ab4d', nombre: 'ESCULPIDO CON ESMALTE TRADICIONAL', precio: '530.00', duracion_slots: 4 },
      { id: '1db5867e-0ed5-4724-a18b-85ef6d3d1e9b', nombre: 'RETIRO DE ESCULPIDO', precio: '220.00', duracion_slots: 2 },
      { id: '1e09e40f-387e-4a16-9f7b-e02a49e3b80c', nombre: 'MTTO UÑAS ESCULPIDAS CON ESMALTE TRADICIONAL', precio: '420.00', duracion_slots: 4 },
      { id: '356f4989-0ccb-49c8-8f38-41ed2c5eb4d7', nombre: 'MTTO ESCULPIDO CON ESMALTE PERMANENTE', precio: '700.00', duracion_slots: 6 },
      { id: '3728cd2d-9e57-4ea7-8618-f2ff7139bce8', nombre: 'ESCULPIDO CON ESMALTADO PERMANENTE', precio: '810.00', duracion_slots: 6 },
      { id: '791dbc3e-f5ee-4565-8417-67776a50e514', nombre: 'ESCULPIDO + MANICURA + ESMALTADO PERMANENTE', precio: '1090.00', duracion_slots: 8 },
    ]
  },
  {
    id: 'eyes-brows',
    name: 'Eyes & Brows',
    slug: 'eyes-brows',
    image: '/Eyes Beauty_compressed.webp',
    description: 'Potenciamos la expresión de tu mirada. Tratamientos especializados en el diseño de cejas y el realce de pestañas para un look natural pero impactante.',
    services: [
      { id: '8c180e1e-62d1-43f7-9e56-656d5c5966b2', nombre: 'TINTE DE PESTAÑAS', precio: '400.00', duracion_slots: 3 },
      { id: 'a696b145-7494-4428-9a1e-5eb7591bf777', nombre: 'TINTE DE CEJAS', precio: '230.00', duracion_slots: 2 },
      { id: 'b8bf8fe9-9c8b-4aba-b620-368cf90ff61a', nombre: 'LIFTING DE PESTAÑAS', precio: '730.00', duracion_slots: 4 },
      { id: 'c259328c-22f4-4159-bb52-7b0642cc14cc', nombre: 'PLANCHADO DE CEJAS', precio: '400.00', duracion_slots: 2 },
    ]
  },
  {
    id: 'manicura-spa',
    name: 'Manicura & Spa',
    slug: 'manicura-spa',
    image: '/manicura_compressed.webp',
    description: 'Más que una manicura, un momento de desconexión. Cuidamos cada detalle de tus manos con protocolos de exfoliación, nutrición y esmaltado de precisión.',
    services: [
      { id: '27404ad6-6cd5-4351-b7bc-cea59b67cbf9', nombre: 'MANICURE SPA', precio: '350.00', duracion_slots: 3 },
      { id: '79d97d89-d90e-4613-97e0-aef0ffb9507a', nombre: 'MANICURE', precio: '280.00', duracion_slots: 2 },
      { id: 'd5b723db-7c98-4170-bd9a-f3022ea43cf2', nombre: 'Manicura SPA', precio: '350.00', duracion_slots: 4 },
    ]
  },
  {
    id: 'cuidado-facial',
    name: 'Cuidado Facial',
    slug: 'cuidado-facial',
    image: '/facial_compressed.webp',
    description: 'Protocolos faciales diseñados para revelar la mejor versión de tu piel. Desde higienes profundas hasta diseños de cejas técnicos para un rostro armonioso.',
    services: [
      { id: '42c8f8b0-a7be-4aae-bc9a-cc82d5e82c26', nombre: 'DEPILACION CARA COMPLETA SIN CEJAS', precio: '480.00', duracion_slots: 3 },
      { id: '476f8568-edbd-4d14-8d2d-074e2503d84f', nombre: 'DEPILACION CEJA CON DISEÑO', precio: '320.00', duracion_slots: 3 },
      { id: '7446ace1-d5fd-4460-aca3-143699475782', nombre: 'HIGIENE FACIAL', precio: '600.00', duracion_slots: 4 },
      { id: '7ec80b22-b020-461c-b4a8-32e69a8b2dfb', nombre: 'DEPILACION CEJA SIN DISEÑO', precio: '180.00', duracion_slots: 3 },
      { id: 'eaba6ef2-9eb7-45ea-82a4-80512042674d', nombre: 'DEPILACION ENTRECEJO', precio: '65.00', duracion_slots: 1 },
    ]
  },
  {
    id: 'masajes-terapeuticos',
    name: 'Masajes Terapéuticos',
    slug: 'masajes-terapeuticos',
    image: '/Masaje_compressed.webp',
    description: 'Tu refugio contra el estrés. Ofrecemos técnicas de relajación y reflexología enfocadas en restaurar tu equilibrio físico y mental.',
    services: [
      { id: '319be8ce-7e90-43b3-994c-cab74d478543', nombre: 'REFLEXOLOGIA PODAL', precio: '300.00', duracion_slots: 2 },
      { id: 'd02213b4-7fc3-4d44-a40d-fa4771ab2677', nombre: 'MASAJE RELAJANTE DE 60 MIN', precio: '1100.00', duracion_slots: 4 },
      { id: 'eed4e52d-74c2-4470-8afb-ed6cdc883135', nombre: 'MASAJE RELAJANTE DE 30 MIN', precio: '660.00', duracion_slots: 2 },
    ]
  },
  {
    id: 'pedicura-avanzada',
    name: 'Pedicura Avanzada',
    slug: 'pedicura-avanzada',
    image: '/Pedicura_compressed.webp',
    description: 'Salud y elegancia para tus pies. Tratamientos técnicos avanzados en un entorno de máximo confort y relax.',
    services: [
      { id: '94fdabca-6226-4254-a899-50b0a1c91ac7', nombre: 'PEDICURA TECNICA', precio: '550.00', duracion_slots: 4 },
      { id: 'cfbbb72a-3295-4e16-ab47-e37a688fdbf9', nombre: 'PEDICURA', precio: '400.00', duracion_slots: 3 },
      { id: 'f98a8ce3-81b3-45e7-a3e6-3d8166fd872f', nombre: 'PEDICURA SPA', precio: '550.00', duracion_slots: 3 },
    ]
  },
  {
    id: 'nail-art-diseno',
    name: 'Nail Art & Diseño',
    slug: 'nail-art-diseno',
    image: '/Nail art_compressed.webp',
    description: 'El arte llevado a tus uñas. Diseños exclusivos, Baby Boomer y técnicas de decoración personalizadas para expresar tu estilo.',
    services: [
      { id: '9a5cafd9-b538-4cf6-b6c5-6ba232dc6a4a', nombre: 'DECORACION BABY BOOMER - AURA', precio: '170.00', duracion_slots: 1 },
      { id: 'e8d4e1fc-ee43-429c-9fa5-9872f33fb5d6', nombre: 'DECORACION FRENCH', precio: '120.00', duracion_slots: 1 },
      { id: '10000000-0000-4000-8000-000000000050', nombre: 'DECORACION $50', precio: '50.00', duracion_slots: 1 },
      { id: '10000000-0000-4000-8000-000000000100', nombre: 'DECORACION $100', precio: '100.00', duracion_slots: 1 },
      { id: '10000000-0000-4000-8000-000000000150', nombre: 'DECORACION $150', precio: '150.00', duracion_slots: 1 },
      { id: '10000000-0000-4000-8000-000000000200', nombre: 'DECORACION $200', precio: '200.00', duracion_slots: 2 },
      { id: '10000000-0000-4000-8000-000000000250', nombre: 'DECORACION $250', precio: '250.00', duracion_slots: 2 },
      { id: '10000000-0000-4000-8000-000000000300', nombre: 'DECORACION $300', precio: '300.00', duracion_slots: 3 },
      { id: '10000000-0000-4000-8000-000000000350', nombre: 'DECORACION $350', precio: '350.00', duracion_slots: 3 },
      { id: '10000000-0000-4000-8000-000000000400', nombre: 'DECORACION $400', precio: '400.00', duracion_slots: 3 },
      { id: '10000000-0000-4000-8000-000000000450', nombre: 'DECORACION $450', precio: '450.00', duracion_slots: 3 },
      { id: '10000000-0000-4000-8000-000000000500', nombre: 'DECORACION $500', precio: '500.00', duracion_slots: 4 },
    ]
  },
  {
    id: 'depilacion-laser',
    name: 'Depilación Láser',
    slug: 'depilacion-laser',
    image: '/depilacion_compressed.webp',
    description: 'Soluciones definitivas para una piel suave. Tecnología de depilación eficaz y profesional para todas las zonas del cuerpo.',
    services: [
      { id: '6272c36d-66fc-4566-83b6-0c191ea62b17', nombre: 'DEPILACION AXILAS-CUELLO-NUCA', precio: '200.00', duracion_slots: 1 },
      { id: '91233dd3-9216-4254-8ed6-3d07673740a0', nombre: 'DEPILACION PIERNAS COMPLETAS', precio: '650.00', duracion_slots: 3 },
      { id: 'b26a925f-a50d-4f86-8bf1-2dfcb6b36171', nombre: 'DEPILACION BRAZOS-PECHO-GLUTEOS', precio: '490.00', duracion_slots: 2 },
      { id: 'e57d084e-6474-46fe-b800-0ec38ffb059d', nombre: 'DEPILACION BIKINI FULL (BRASILEÑO)', precio: '700.00', duracion_slots: 3 },
      { id: 'f978e731-0bec-4ff8-b82a-5e4aa2202629', nombre: 'DEPILACION MANOS O PIES MUJER', precio: '50.00', duracion_slots: 1 },
    ]
  }
]
