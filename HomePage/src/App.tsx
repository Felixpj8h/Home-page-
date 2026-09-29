import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AdaptiveDpr, Html, Line, OrbitControls, Sparkles, Stars, useGLTF, useTexture } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Box3,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three'
import type { GLTF } from 'three-stdlib'
import sunUrl from '../Models/Sun.glb?url'
import moonUrl from '../Models/Moon.glb?url'
import venusUrl from '../Models/Venus.glb?url'
import earthUrl from '../Models/Earth.glb?url'
import marsUrl from '../Models/Mars.glb?url'
import jupiterUrl from '../Models/Jupiter.glb?url'
import saturnUrl from '../Models/Saturn.glb?url'
import uranusUrl from '../Models/Uranus.glb?url'
import neptuneUrl from '../Models/Neptune.glb?url'
import mercuryTextureUrl from '../Models/Textures/Mercury.png?url'
import venusTextureUrl from '../Models/Textures/Venus.png?url'
import earthTextureUrl from '../Models/Textures/Earth.png?url'
import marsTextureUrl from '../Models/Textures/Mars.png?url'
import jupiterTextureUrl from '../Models/Textures/Jupiter.png?url'
import saturnTextureUrl from '../Models/Textures/Saturn.png?url'
import uranusTextureUrl from '../Models/Textures/Uranus.png?url'
import neptuneTextureUrl from '../Models/Textures/Neptune.png?url'
import './App.css'

type PlanetSpec = {
  name: string
  model: string
  texture: string
  orbit: number
  size: number
  speed: number
  phase: number
  inclination: number
  ringColor?: string
}

const planets: PlanetSpec[] = [
  { name: 'Mercury', model: moonUrl, texture: mercuryTextureUrl, orbit: 1.72, size: 0.18, speed: 0.33, phase: 4.1, inclination: 0.08 },
  { name: 'Venus', model: venusUrl, texture: venusTextureUrl, orbit: 2.35, size: 0.3, speed: 0.24, phase: 2.8, inclination: -0.04 },
  { name: 'Earth', model: earthUrl, texture: earthTextureUrl, orbit: 3.15, size: 0.36, speed: 0.19, phase: 0.32, inclination: 0.03 },
  { name: 'Mars', model: marsUrl, texture: marsTextureUrl, orbit: 4.05, size: 0.25, speed: 0.155, phase: 3.55, inclination: -0.08 },
  { name: 'Jupiter', model: jupiterUrl, texture: jupiterTextureUrl, orbit: 5.1, size: 0.78, speed: 0.09, phase: 0.05, inclination: 0.04 },
  { name: 'Saturn', model: saturnUrl, texture: saturnTextureUrl, orbit: 6.25, size: 0.9, speed: 0.065, phase: 3.02, inclination: -0.035, ringColor: '#c9aa78' },
  { name: 'Uranus', model: uranusUrl, texture: uranusTextureUrl, orbit: 7.25, size: 0.54, speed: 0.045, phase: 1.17, inclination: 0.07, ringColor: '#91a9b4' },
  { name: 'Neptune', model: neptuneUrl, texture: neptuneTextureUrl, orbit: 8.2, size: 0.52, speed: 0.034, phase: 5.38, inclination: -0.06 },
]

const PLANET_SPIN_SPEED = 0.24

const allModels = [sunUrl, moonUrl, ...planets.map((planet) => planet.model)]
allModels.forEach((model) => useGLTF.preload(model))
planets.forEach((planet) => useTexture.preload(planet.texture))

function Model({ url, radius, isSun = false }: { url: string; radius: number; isSun?: boolean }) {
  const { scene } = useGLTF(url) as GLTF
  const model = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = !isSun
        child.receiveShadow = !isSun
        if (isSun) {
          child.material = new MeshStandardMaterial({
            color: '#ff9a3d',
            emissive: '#ff6a18',
            emissiveIntensity: 2.5,
            flatShading: true,
            roughness: 0.7,
          })
        } else if (child.material instanceof MeshStandardMaterial) {
          child.material = child.material.clone()
          child.material.roughness = 0.8
        }
      }
    })
    const box = new Box3().setFromObject(copy)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const largestSide = Math.max(size.x, size.y, size.z) || 1
    copy.position.sub(center)
    copy.scale.setScalar((radius * 2) / largestSide)
    return copy
  }, [scene, radius, isSun])

  return <primitive object={model} />
}

function createSphericalUvGeometry(source: BufferGeometry) {
  // The Blender UVs on the low-poly spheres are uneven. Re-project each body
  // as a globe so horizontal texture bands stay level and evenly spaced.
  const geometry = source.index ? source.toNonIndexed() : source.clone()
  const positions = geometry.getAttribute('position')
  geometry.computeBoundingBox()
  const center = geometry.boundingBox?.getCenter(new Vector3()) ?? new Vector3()
  const uvs = new Float32Array(positions.count * 2)

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index) - center.x
    const y = positions.getY(index) - center.y
    const z = positions.getZ(index) - center.z
    const length = Math.hypot(x, y, z) || 1

    uvs[index * 2] = 0.5 + Math.atan2(z, x) / (Math.PI * 2)
    uvs[index * 2 + 1] = 0.5 + Math.asin(Math.max(-1, Math.min(1, y / length))) / Math.PI
  }

  // Keep triangles crossing the longitude seam from interpolating across the
  // entire image. Values above 1 wrap cleanly because wrapS is RepeatWrapping.
  for (let index = 0; index < positions.count; index += 3) {
    const a = uvs[index * 2]
    const b = uvs[(index + 1) * 2]
    const c = uvs[(index + 2) * 2]
    if (Math.max(a, b, c) - Math.min(a, b, c) > 0.5) {
      for (let vertex = index; vertex < index + 3; vertex += 1) {
        if (uvs[vertex * 2] < 0.5) uvs[vertex * 2] += 1
      }
    }
  }

  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  return geometry
}

function TexturedModel({
  url,
  textureUrl,
  radius,
  ringColor,
  stableRing = false,
  paused = false,
}: {
  url: string
  textureUrl: string
  radius: number
  ringColor?: string
  stableRing?: boolean
  paused?: boolean
}) {
  const { scene } = useGLTF(url) as GLTF
  const texture = useTexture(textureUrl)
  const ringRef = useRef<Group>(null)

  const model = useMemo(() => {
    texture.colorSpace = SRGBColorSpace
    texture.flipY = false
    texture.wrapS = RepeatWrapping
    texture.needsUpdate = true

    const copy = scene.clone(true)
    copy.traverse((child) => {
      if (!(child instanceof Mesh)) return

      child.castShadow = true
      child.receiveShadow = true

      const isRing = child.name.toLowerCase().includes('circle')
      if (!isRing) child.geometry = createSphericalUvGeometry(child.geometry)
      child.material = isRing
        ? new MeshStandardMaterial({
            color: ringColor ?? '#b9a789',
            roughness: 0.86,
            metalness: 0,
            side: DoubleSide,
            transparent: true,
            opacity: 0.66,
          })
        : new MeshStandardMaterial({
            map: texture,
            color: '#ffffff',
            roughness: 0.78,
            metalness: 0,
            flatShading: true,
          })
    })

    const box = new Box3().setFromObject(copy)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const largestSide = Math.max(size.x, size.y, size.z) || 1
    copy.position.sub(center)
    copy.scale.setScalar((radius * 2) / largestSide)
    return copy
  }, [scene, texture, radius, ringColor])

  const separatedModel = useMemo(() => {
    if (!stableRing) return null

    const body = model.clone(true)
    const ring = model.clone(true)
    body.traverse((child) => {
      if (child instanceof Mesh && child.name.toLowerCase().includes('circle')) child.visible = false
    })
    ring.traverse((child) => {
      if (child instanceof Mesh && !child.name.toLowerCase().includes('circle')) child.visible = false
    })
    return { body, ring }
  }, [model, stableRing])

  useFrame((_, delta) => {
    if (!paused && stableRing && ringRef.current) {
      ringRef.current.rotation.y -= delta * PLANET_SPIN_SPEED
    }
  })

  if (separatedModel) {
    return (
      <>
        <primitive object={separatedModel.body} />
        <group ref={ringRef}>
          <primitive object={separatedModel.ring} />
        </group>
      </>
    )
  }

  return <primitive object={model} />
}

function Moon({ paused, labels }: { paused: boolean; labels: boolean }) {
  const ref = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!paused && ref.current) ref.current.rotation.y += delta * 0.65
  })

  return (
    <group ref={ref} rotation={[0.18, 0, 0]}>
      <group position={[0.68, 0, 0]}>
        <Model url={moonUrl} radius={0.1} />
        {labels && (
          <Html center position={[0, 0.23, 0]} distanceFactor={11} zIndexRange={[10, 0]}>
            <span className="planet-label">Moon</span>
          </Html>
        )}
      </group>
    </group>
  )
}

function Orbit({ radius }: { radius: number }) {
  const points = useMemo(
    () => Array.from({ length: 97 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2
      return new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
    }),
    [radius],
  )
  return <Line points={points} color="#bb8d66" transparent opacity={0.27} lineWidth={0.55} />
}

function Planet({ planet, paused, labels }: { planet: PlanetSpec; paused: boolean; labels: boolean }) {
  const orbitingRef = useRef<Group>(null)
  const planetRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (paused) return
    if (orbitingRef.current) orbitingRef.current.rotation.y += delta * planet.speed
    if (planetRef.current) planetRef.current.rotation.y += delta * PLANET_SPIN_SPEED
  })

  return (
    <group rotation={[planet.inclination, planet.phase, 0]}>
      <group ref={orbitingRef}>
        <group ref={planetRef} position={[planet.orbit, 0, 0]}>
          <TexturedModel
            url={planet.model}
            textureUrl={planet.texture}
            radius={planet.size}
            ringColor={planet.ringColor}
            stableRing={planet.name === 'Uranus'}
            paused={paused}
          />
          {planet.name === 'Earth' && <Moon paused={paused} labels={labels} />}
          {labels && (
            <Html center position={[0, planet.size + 0.34, 0]} distanceFactor={11} zIndexRange={[10, 0]}>
              <span className="planet-label">{planet.name}</span>
            </Html>
          )}
        </group>
      </group>
    </group>
  )
}

function SolarSystem({ paused, labels }: { paused: boolean; labels: boolean }) {
  const systemRef = useRef<Group>(null)

  useFrame(({ pointer }, delta) => {
    if (!systemRef.current || paused) return
    systemRef.current.rotation.x += (pointer.y * 0.09 - systemRef.current.rotation.x) * Math.min(delta * 2.5, 1)
    systemRef.current.rotation.y += (pointer.x * 0.08 - systemRef.current.rotation.y) * Math.min(delta * 2.5, 1)
  })

  return (
    <group ref={systemRef} position={[2.7, 0.1, 0]} rotation={[0.12, -0.18, -0.12]}>
      <Model url={sunUrl} radius={1.32} isSun />
      <pointLight color="#ff9a45" intensity={82} distance={19} decay={2} />
      <Sparkles count={48} scale={2.6} size={5} speed={0.25} color="#ffb862" opacity={0.55} />
      {planets.map((planet) => <Orbit key={`orbit-${planet.name}`} radius={planet.orbit} />)}
      {planets.map((planet) => <Planet key={planet.name} planet={planet} paused={paused} labels={labels} />)}
    </group>
  )
}

function Scene({ paused, labels }: { paused: boolean; labels: boolean }) {
  return (
    <>
      <color attach="background" args={['#03060d']} />
      <fog attach="fog" args={['#03060d', 19, 34]} />
      <ambientLight intensity={0.3} color="#7f95bc" />
      <hemisphereLight args={['#6c82a8', '#160b07', 0.48]} />
      <Stars radius={75} depth={42} count={2200} factor={2.7} saturation={0.35} fade speed={paused ? 0 : 0.12} />
      <Suspense fallback={null}><SolarSystem paused={paused} labels={labels} /></Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={12} maxDistance={24} minPolarAngle={Math.PI * 0.27} maxPolarAngle={Math.PI * 0.7} target={[2.4, 0, 0]} autoRotate={!paused} autoRotateSpeed={0.12} dampingFactor={0.06} enableDamping />
      <AdaptiveDpr pixelated />
    </>
  )
}

function App() {
  const [paused, setPaused] = useState(false)
  const [labels, setLabels] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) setPaused(true)
  }, [])

  return (
    <main className="experience">
      <div className="scene" aria-hidden="true">
        <Canvas camera={{ position: [0.1, 4.9, 17.2], fov: 46, near: 0.1, far: 120 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          <Scene paused={paused} labels={labels} />
        </Canvas>
      </div>
      <div className="cosmic-haze" />

      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Felix Johannessen, home">FJ<span>.</span></a>
        <button type="button" className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
        <nav className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Primary navigation">
          <a className="active" href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#projects" onClick={() => setMenuOpen(false)}>Projects</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="mailto:hello@felix.dev" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
      </header>

      <section className="hero-copy" id="home">
        <p className="eyebrow"><span>01</span> Portfolio / 2026</p>
        <h1>Felix<br />Johannessen</h1>
        <p className="role">Developer <i /> Designer <i /> Explorer</p>
        <p className="intro">I build digital worlds where thoughtful design meets expressive technology.</p>
        <a className="work-link" href="#projects">Explore selected work <span aria-hidden="true">↗</span></a>
      </section>

      <aside className="scene-controls" aria-label="Solar system controls">
        <p>Interactive orbit</p>
        <div>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? 'Play' : 'Pause'}</button>
          <button type="button" onClick={() => setLabels((value) => !value)} aria-pressed={labels}>{labels ? 'Hide names' : 'Show names'}</button>
        </div>
      </aside>

      <div className="drag-hint" aria-hidden="true"><span /> Drag to explore</div>
      <div className="side-note left">Curiosity<br />builds<br />better worlds</div>
      <div className="section-anchor" id="projects" aria-hidden="true" />
      <div className="section-anchor" id="about" aria-hidden="true" />
    </main>
  )
}

export default App
