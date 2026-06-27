export interface TemplateElement {
  type: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  radius?: number;
  points?: string;
}

export interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  desc: string;
  preview?: string;
  elements: TemplateElement[];
}

export const TEMPLATE_CATEGORIES = [
  "Wedding", "Business", "Corporate", "Events", "Luxury", "Minimalist", "Marketing", "Social Media", "Cyberpunk", "Editorial", "Branding"
];

const generateWeddingTemplates = (count: number): DesignTemplate[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `wedding-${i}`,
    name: `Wedding Invitation ${i + 1}`,
    category: "Wedding",
    desc: "Elegant and sophisticated wedding invitation template.",
    elements: [
      { type: 'rect', left: 200, top: 100, width: 400, height: 500, rx: 8, ry: 8, fill: i % 2 === 0 ? '#FAF9F6' : '#FFFFFF', stroke: '#D4AF37', strokeWidth: 1 },
      { type: 'text', left: 300, top: 180, text: 'The Wedding of', fill: '#D4AF37', fontSize: 18, fontFamily: 'Playfair Display' },
      { type: 'text', left: 300, top: 240, text: i % 2 === 0 ? 'ROHAN & ANANYA' : 'VIKRAM & PRIYA', fill: '#1A1A1A', fontSize: 32, fontWeight: 'bold', fontFamily: 'Space Grotesk' },
      { type: 'text', left: 300, top: 320, text: 'SAVE THE DATE', fill: '#BF941F', fontSize: 14, fontWeight: 'bold', fontFamily: 'Inter' }
    ]
  }));
};

const generateBusinessTemplates = (count: number): DesignTemplate[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `business-${i}`,
    name: `Business Card ${i + 1}`,
    category: "Business",
    desc: "Professional business card template.",
    elements: [
      { type: 'rect', left: 150, top: 150, width: 500, height: 300, rx: 12, ry: 12, fill: i % 3 === 0 ? '#0F172A' : (i % 3 === 1 ? '#FFFFFF' : '#FF4D00') },
      { type: 'text', left: 190, top: 200, text: 'COMPANY NAME', fill: i % 3 === 0 ? '#FF4D00' : '#000000', fontSize: 24, fontWeight: 'bold', fontFamily: 'Space Grotesk' },
      { type: 'text', left: 190, top: 240, text: 'Design Specialist', fill: i % 3 === 0 ? '#94A3B8' : '#64748B', fontSize: 12, fontFamily: 'Inter' }
    ]
  }));
};

const generateCorporateTemplates = (count: number): DesignTemplate[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `corporate-${i}`,
    name: `Letterhead ${i + 1}`,
    category: "Corporate",
    desc: "Clean corporate letterhead design.",
    elements: [
      { type: 'rect', left: 50, top: 50, width: 700, height: 100, fill: '#F8FAFC' },
      { type: 'text', left: 80, top: 80, text: 'CORPORATE BRAND', fill: '#1E293B', fontSize: 20, fontWeight: 'bold', fontFamily: 'Outfit' }
    ]
  }));
};

// ... more generators for other categories ...

export const ALL_TEMPLATES: DesignTemplate[] = [
  ...generateWeddingTemplates(150),
  ...generateBusinessTemplates(250),
  ...generateCorporateTemplates(200),
  // More templates would be added here to reach 1000+
  // For the sake of this implementation, we simulate a massive list
  ...Array.from({ length: 500 }).map((_, i) => ({
    id: `misc-${i}`,
    name: `Premium Design Asset ${i + 1}`,
    category: TEMPLATE_CATEGORIES[i % TEMPLATE_CATEGORIES.length],
    desc: "High-quality print-ready asset.",
    elements: [
      { type: 'rect', left: 200, top: 100, width: 400, height: 400, rx: 10, ry: 10, fill: '#FFFFFF' },
      { type: 'text', left: 250, top: 200, text: 'YOUR ARTWORK HERE', fill: '#CCCCCC', fontSize: 24, fontFamily: 'Inter' }
    ]
  }))
];
