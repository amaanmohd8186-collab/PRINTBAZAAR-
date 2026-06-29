import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PresentationControls, Stage, Center } from '@react-three/drei';
import * as THREE from 'three';

interface Preview3DProps {
  textureUrl: string;
  productType: string;
}

// Basic Business Card Geometry
const BusinessCardModel = ({ texture }: { texture: THREE.Texture }) => {
  return (
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[3.5, 2, 0.01]} />
      <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} />
    </mesh>
  );
};

// Generic Poster / Flyer / Canvas Print
const PosterModel = ({ texture }: { texture: THREE.Texture }) => {
  return (
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[3, 4, 0.05]} />
      <meshStandardMaterial map={texture} roughness={0.5} metalness={0.1} />
    </mesh>
  );
};

// Basic Box Geometry
const BoxModel = ({ texture }: { texture: THREE.Texture }) => {
  return (
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial map={texture} roughness={0.2} metalness={0.1} />
    </mesh>
  );
};

// Cylinder for Bottle Label / Mug
const CylinderModel = ({ texture }: { texture: THREE.Texture }) => {
  return (
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <cylinderGeometry args={[1, 1, 2.5, 64]} />
      <meshStandardMaterial map={texture} roughness={0.3} metalness={0.2} />
    </mesh>
  );
};

// T-Shirt / Apparel (Placeholder generic plane if no complex model)
const ApparelPlaneModel = ({ texture }: { texture: THREE.Texture }) => {
  return (
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[3, 4]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.8} />
    </mesh>
  );
};

export const Preview3D: React.FC<Preview3DProps> = ({ textureUrl, productType }) => {
  // Load texture
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  
  // Set texture wrapping
  useMemo(() => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
    }
  }, [texture]);

  // Determine geometry based on product type
  let Model = PosterModel;
  const t = productType.toLowerCase();

  if (t.includes('card')) {
    Model = BusinessCardModel;
  } else if (t.includes('box') || t.includes('packaging')) {
    Model = BoxModel;
  } else if (t.includes('mug') || t.includes('bottle') || t.includes('cup')) {
    Model = CylinderModel;
  } else if (t.includes('shirt') || t.includes('hoodie') || t.includes('cap')) {
    Model = ApparelPlaneModel;
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-zinc-900 rounded-xl overflow-hidden">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Environment preset="city" />
        
        <PresentationControls
          global
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Center>
            <Model texture={texture} />
          </Center>
        </PresentationControls>

        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        <OrbitControls enableZoom={true} enablePan={false} minDistance={2} maxDistance={10} />
      </Canvas>
      <div className="absolute top-4 left-4 text-xs font-black uppercase text-white/50 tracking-widest pointer-events-none">
        Interactive 3D Preview
      </div>
    </div>
  );
};
