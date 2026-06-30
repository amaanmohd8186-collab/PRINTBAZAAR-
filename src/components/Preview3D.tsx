import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center } from '@react-three/drei';
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
  const [selectedType, setSelectedType] = useState<string>('');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Initialize selected type based on productType prop
  useEffect(() => {
    const t = (productType || '').toLowerCase();
    if (t.includes('card')) {
      setSelectedType('card');
    } else if (t.includes('box') || t.includes('packaging')) {
      setSelectedType('box');
    } else if (t.includes('mug') || t.includes('bottle') || t.includes('cup')) {
      setSelectedType('mug');
    } else if (t.includes('shirt') || t.includes('hoodie') || t.includes('cap')) {
      setSelectedType('apparel');
    } else {
      setSelectedType('poster');
    }
  }, [productType]);

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

  // Determine geometry based on selected type
  let Model = PosterModel;
  if (selectedType === 'card') {
    Model = BusinessCardModel;
  } else if (selectedType === 'box') {
    Model = BoxModel;
  } else if (selectedType === 'mug') {
    Model = CylinderModel;
  } else if (selectedType === 'apparel') {
    Model = ApparelPlaneModel;
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-zinc-950 rounded-xl overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full min-h-[300px]">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <Environment preset="city" />
          
          <Center>
            <Model texture={texture} />
          </Center>

          <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} />
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minDistance={2} 
            maxDistance={10}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {/* Model Type Selector */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto bg-black/40 backdrop-blur-md p-2 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedType('card')}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${selectedType === 'card' ? 'bg-[#FF4D00] text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Card
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('poster')}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${selectedType === 'poster' ? 'bg-[#FF4D00] text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Poster
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('box')}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${selectedType === 'box' ? 'bg-[#FF4D00] text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Box
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('mug')}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${selectedType === 'mug' ? 'bg-[#FF4D00] text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Mug/Bottle
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('apparel')}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${selectedType === 'apparel' ? 'bg-[#FF4D00] text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Apparel
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${autoRotate ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
        >
          {autoRotate ? 'Auto Spin: ON' : 'Auto Spin: OFF'}
        </button>
      </div>

      <div className="absolute top-4 left-4 text-[10px] font-extrabold uppercase text-white/40 tracking-widest pointer-events-none">
        Interactive 3D Preview
      </div>
    </div>
  );
};
