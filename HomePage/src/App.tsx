import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { AdaptiveDpr, Html, Line, OrbitControls, Stars, useGLTF, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  Box3,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  RepeatWrapping,
  SRGBColorSpace,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { GLTF, OrbitControls as OrbitControlsImpl } from 'three-stdlib'
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
  periodYears: number
  eccentricity: number
  phase: number
  inclination: number
  ringColor?: string
}

const orbitFromAu = (distanceAu: number) => {
  const closestAu = 0.39
  const farthestAu = 30.06
  const innerRadius = 1.5
  const outerRadius = 8.2
  const position = (Math.log(distanceAu) - Math.log(closestAu)) / (Math.log(farthestAu) - Math.log(closestAu))
  return innerRadius + position * (outerRadius - innerRadius)
}

type PlanetInput = Omit<PlanetSpec, 'orbit'> & { distanceAu: number }

const planetInputs: PlanetInput[] = [
  { name: 'Mercury', model: moonUrl, texture: mercuryTextureUrl, distanceAu: 0.39, size: 0.18, periodYears: 0.241, eccentricity: 0.206, phase: 4.1, inclination: 0.122 },
  { name: 'Venus', model: venusUrl, texture: venusTextureUrl, distanceAu: 0.72, size: 0.3, periodYears: 0.615, eccentricity: 0.007, phase: 2.8, inclination: 0.059 },
  { name: 'Earth', model: earthUrl, texture: earthTextureUrl, distanceAu: 1, size: 0.36, periodYears: 1, eccentricity: 0.017, phase: 0.32, inclination: 0 },
  { name: 'Mars', model: marsUrl, texture: marsTextureUrl, distanceAu: 1.52, size: 0.25, periodYears: 1.881, eccentricity: 0.093, phase: 3.55, inclination: 0.032 },
  { name: 'Jupiter', model: jupiterUrl, texture: jupiterTextureUrl, distanceAu: 5.2, size: 0.78, periodYears: 11.862, eccentricity: 0.049, phase: 0.05, inclination: 0.023 },
  { name: 'Saturn', model: saturnUrl, texture: saturnTextureUrl, distanceAu: 9.54, size: 0.9, periodYears: 29.457, eccentricity: 0.057, phase: 3.02, inclination: 0.043, ringColor: '#c9aa78' },
  { name: 'Uranus', model: uranusUrl, texture: uranusTextureUrl, distanceAu: 19.19, size: 0.54, periodYears: 84.011, eccentricity: 0.046, phase: 1.17, inclination: 0.013, ringColor: '#91a9b4' },
  { name: 'Neptune', model: neptuneUrl, texture: neptuneTextureUrl, distanceAu: 30.06, size: 0.52, periodYears: 164.79, eccentricity: 0.011, phase: 5.38, inclination: 0.031 },
]

const ASTEROID_BELT_INNER_GAP = 0.38
const ASTEROID_BELT_WIDTH = 0.68
const ASTEROID_TO_JUPITER_GAP = 0.4

const planets: PlanetSpec[] = (() => {
  let previousOrbit = 0
  let previousSize = 1.32
  const minimumSurfaceGap = 0.18

  return planetInputs.map(({ distanceAu, ...planet }) => {
    const naturalOrbit = orbitFromAu(distanceAu)
    const clearanceOrbit = previousOrbit + previousSize + planet.size + minimumSurfaceGap
    const beltClearanceOrbit = planet.name === 'Jupiter'
      ? previousOrbit + ASTEROID_BELT_INNER_GAP + ASTEROID_BELT_WIDTH + planet.size + ASTEROID_TO_JUPITER_GAP
      : 0
    const orbit = Math.max(naturalOrbit, clearanceOrbit, beltClearanceOrbit)
    previousOrbit = orbit
    previousSize = planet.size
    return { ...planet, orbit }
  })
})()

const PLANET_SPIN_SPEED = 0.24
const SUN_X = 2.7
const SUN_Y = 0.1
const SUN_TARGET: [number, number, number] = [SUN_X, SUN_Y, 0]
const HOME_CAMERA_POSITION = new Vector3(-4.05, 5.8, 21)

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

const sunVertexShader = `
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;

  void main() {
    vLocalPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const sunFragmentShader = `
  uniform float uTime;
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * amplitude;
      p = p * 2.03 + vec3(1.7, 3.1, 2.4);
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec3 p = normalize(vLocalPosition);
    float broad = fbm(p * 3.3 + vec3(0.0, uTime * 0.045, uTime * 0.025));
    float detail = fbm(p * 8.0 - vec3(uTime * 0.035, 0.0, uTime * 0.02));
    float heat = smoothstep(0.18, 0.92, broad * 0.72 + detail * 0.4);

    vec3 faceNormal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    float facetLight = 0.76 + 0.24 * abs(dot(faceNormal, normalize(vec3(0.35, 0.8, 0.5))));
    vec3 ember = vec3(1.12, 0.11, 0.018);
    vec3 gold = vec3(2.15, 0.56, 0.065);
    vec3 whiteHot = vec3(3.05, 1.25, 0.28);
    vec3 color = mix(ember, gold, heat);
    color = mix(color, whiteHot, smoothstep(0.66, 0.96, heat));
    gl_FragColor = vec4(color * facetLight, 1.0);
  }
`

function Sun({ radius }: { radius: number }) {
  const { scene } = useGLTF(sunUrl) as GLTF
  const material = useMemo(() => new ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader,
  }), [])

  const model = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = material
        child.castShadow = false
        child.receiveShadow = false
      }
    })
    const box = new Box3().setFromObject(copy)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    copy.position.sub(center)
    copy.scale.setScalar((radius * 2) / (Math.max(size.x, size.y, size.z) || 1))
    return copy
  }, [scene, material, radius])

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
  })

  useEffect(() => () => material.dispose(), [material])
  return <primitive object={model} />
}

function SpaceBackdrop({ paused }: { paused: boolean }) {
  const backdropRef = useRef<Mesh>(null)

  useFrame(({ pointer }, delta) => {
    if (!backdropRef.current) return
    const response = Math.min(delta * 0.24, 1)
    backdropRef.current.rotation.x += (pointer.y * 0.018 - backdropRef.current.rotation.x) * response
    backdropRef.current.rotation.y += (pointer.x * 0.025 - backdropRef.current.rotation.y) * response
    if (!paused) backdropRef.current.rotation.z += delta * 0.00035
  })

  return (
    <mesh ref={backdropRef} scale={62}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        vertexShader={`
          varying vec3 vDirection;
          void main() {
            vDirection = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vDirection;

          float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          float noise(vec3 p) {
            vec3 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y), mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
          }
          float fbm(vec3 p) {
            float n = 0.0;
            n += noise(p) * 0.55; p *= 2.03;
            n += noise(p) * 0.28; p *= 2.07;
            n += noise(p) * 0.14;
            return n;
          }
          void main() {
            vec3 d = normalize(vDirection);
            float bend = d.y + 0.15 * sin(d.x * 5.0) - 0.08 * sin(d.z * 7.0);
            float milkyWay = exp(-bend * bend * 15.0);
            float cloud = fbm(d * 5.2 + vec3(2.1, 0.4, 1.7));
            float dust = smoothstep(0.36, 0.82, cloud) * milkyWay;
            float secondBand = exp(-pow(d.y - 0.28 + 0.12 * sin(d.z * 4.0), 2.0) * 24.0);
            float distantCloud = smoothstep(0.48, 0.84, fbm(d * 8.0 - vec3(1.4, 2.2, 0.3))) * secondBand;
            vec3 night = vec3(0.002, 0.006, 0.016);
            vec3 blue = vec3(0.018, 0.065, 0.145);
            vec3 violet = vec3(0.055, 0.035, 0.105);
            vec3 color = night + mix(blue, violet, cloud) * dust * 0.68 + vec3(0.018, 0.03, 0.075) * distantCloud * 0.36;
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  )
}

function DepthLayers({ paused }: { paused: boolean }) {
  const farRef = useRef<Group>(null)
  const nearRef = useRef<Group>(null)

  useFrame(({ pointer }, delta) => {
    const response = Math.min(delta * 0.45, 1)
    if (farRef.current) {
      farRef.current.position.x += (-pointer.x * 0.34 - farRef.current.position.x) * response
      farRef.current.position.y += (-pointer.y * 0.22 - farRef.current.position.y) * response
      if (!paused) farRef.current.rotation.y += delta * 0.0009
    }
    if (nearRef.current) {
      nearRef.current.position.x += (-pointer.x * 0.72 - nearRef.current.position.x) * response
      nearRef.current.position.y += (-pointer.y * 0.46 - nearRef.current.position.y) * response
      if (!paused) nearRef.current.rotation.y -= delta * 0.0015
    }
  })

  return (
    <>
      <group ref={farRef}>
        <Stars radius={48} depth={28} count={5200} factor={2.1} saturation={0.42} fade speed={paused ? 0 : 0.05} />
      </group>
      <group ref={nearRef}>
        <Stars radius={33} depth={16} count={260} factor={5.2} saturation={0.68} fade speed={paused ? 0 : 0.025} />
      </group>
    </>
  )
}

function BloomEffect() {
  const { gl, scene, camera, size } = useThree()
  const composer = useMemo(() => {
    const nextComposer = new EffectComposer(gl)
    nextComposer.addPass(new RenderPass(scene, camera))
    nextComposer.addPass(new UnrealBloomPass(new Vector2(1, 1), 0.82, 0.52, 0.94))
    nextComposer.addPass(new OutputPass())
    return nextComposer
  }, [gl, scene, camera])

  useEffect(() => {
    composer.setPixelRatio(Math.min(gl.getPixelRatio(), 1.5))
    composer.setSize(size.width, size.height)
  }, [composer, gl, size])

  useEffect(() => () => composer.dispose(), [composer])
  useFrame(() => composer.render(), 1)
  return null
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
  flipTextureY = false,
  stableRing = false,
  paused = false,
}: {
  url: string
  textureUrl: string
  radius: number
  ringColor?: string
  flipTextureY?: boolean
  stableRing?: boolean
  paused?: boolean
}) {
  const { scene } = useGLTF(url) as GLTF
  const texture = useTexture(textureUrl)
  const ringRef = useRef<Group>(null)

  const model = useMemo(() => {
    texture.colorSpace = SRGBColorSpace
    texture.flipY = flipTextureY
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
  }, [scene, texture, radius, ringColor, flipTextureY])

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

const layeredAtmosphereColors = {
  Earth: {
    rayleigh: '#2f7dff',
    low: '#a8efff',
    upper: '#7058ff',
    sunset: '#ff8f5f',
  },
  Mars: {
    rayleigh: '#f66b3c',
    low: '#ffb477',
    upper: '#c74737',
    sunset: '#ffd08a',
  },
} as const

function LayeredAtmosphere({ radius, planet }: { radius: number; planet: keyof typeof layeredAtmosphereColors }) {
  const atmosphereRef = useRef<Group>(null)
  const atmosphereWorld = useMemo(() => new Vector3(), [])
  const sunWorld = useMemo(() => new Vector3(), [])
  const sunDirection = useMemo(() => new Vector3(1, 0, 0), [])
  const colors = layeredAtmosphereColors[planet]
  const shells = useMemo(() => Array.from({ length: 20 }, (_, index) => {
    const height = index / 19
    return {
      scale: 1.018 + height * 0.402,
      density: 0.23 * Math.exp(-height * 3.7),
      height,
    }
  }).map((shell) => ({
    ...shell,
    uniforms: {
      uSunDirection: { value: sunDirection },
      uRayleighColor: { value: new Color(colors.rayleigh) },
      uLowAtmosphereColor: { value: new Color(colors.low) },
      uUpperAtmosphereColor: { value: new Color(colors.upper) },
      uSunsetColor: { value: new Color(colors.sunset) },
      uDensity: { value: shell.density },
      uHeight: { value: shell.height },
    },
  })), [sunDirection, colors])

  useFrame(() => {
    const atmosphere = atmosphereRef.current
    const system = atmosphere?.parent?.parent?.parent
    if (!atmosphere || !system) return

    atmosphere.getWorldPosition(atmosphereWorld)
    sunWorld.set(0, 0, 0)
    system.localToWorld(sunWorld)
    sunDirection.copy(sunWorld).sub(atmosphereWorld).normalize()
  })

  return (
    <group ref={atmosphereRef}>
      {shells.map((shell) => (
        <mesh key={shell.scale} scale={radius * shell.scale}>
          <sphereGeometry args={[1, 48, 32]} />
          <shaderMaterial
            uniforms={shell.uniforms}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            side={BackSide}
            vertexShader={`
              varying vec3 vWorldNormal;
              varying vec3 vWorldPosition;
              void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
              }
            `}
            fragmentShader={`
              uniform vec3 uSunDirection;
              uniform vec3 uRayleighColor;
              uniform vec3 uLowAtmosphereColor;
              uniform vec3 uUpperAtmosphereColor;
              uniform vec3 uSunsetColor;
              uniform float uDensity;
              uniform float uHeight;
              varying vec3 vWorldNormal;
              varying vec3 vWorldPosition;

              void main() {
                vec3 normal = normalize(vWorldNormal);
                vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
                float viewDot = abs(dot(normal, viewDirection));
                float sunDot = dot(normal, normalize(uSunDirection));
                float horizon = pow(1.0 - viewDot, mix(1.7, 2.8, uHeight));
                float daylight = smoothstep(-0.22, 0.42, sunDot);
                float terminator = exp(-pow((sunDot + 0.03) * 5.0, 2.0));
                float forwardScatter = pow(max(dot(viewDirection, normalize(uSunDirection)), 0.0), 6.0);

                vec3 layerColor = mix(uLowAtmosphereColor, uRayleighColor, smoothstep(0.0, 0.68, uHeight));
                layerColor = mix(layerColor, uUpperAtmosphereColor, smoothstep(0.68, 1.0, uHeight));
                vec3 rayleigh = layerColor * horizon * (0.55 + daylight * 0.95);
                vec3 sunset = uSunsetColor * horizon * terminator * (0.24 + forwardScatter * 0.58);
                float alpha = horizon * (0.38 + daylight * 0.58) * uDensity * 2.6;
                vec3 scattering = (rayleigh + sunset) * uDensity * 3.4;
                gl_FragColor = vec4(scattering, clamp(alpha, 0.0, 0.3));
              }
            `}
          />
        </mesh>
      ))}
    </group>
  )
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

function Orbit({ radius, eccentricity, inclination }: { radius: number; eccentricity: number; inclination: number }) {
  const safeRadius = Number.isFinite(radius) ? radius : 1
  const safeEccentricity = Number.isFinite(eccentricity) ? Math.min(Math.abs(eccentricity), 0.95) : 0
  const semiMinorAxis = safeRadius * Math.sqrt(1 - safeEccentricity * safeEccentricity)
  const points = useMemo(
    () => Array.from({ length: 97 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2
      return new Vector3(Math.cos(angle) * safeRadius, 0, Math.sin(angle) * semiMinorAxis)
    }),
    [safeRadius, semiMinorAxis],
  )
  return (
    <group rotation={[inclination, 0, 0]}>
      <Line points={points} color="#bb8d66" transparent opacity={0.27} lineWidth={0.55} />
    </group>
  )
}

function AsteroidBelt({ paused }: { paused: boolean }) {
  const beltRef = useRef<Group>(null)
  const meshRef = useRef<InstancedMesh>(null)
  const count = 280
  const marsOrbit = planets.find((planet) => planet.name === 'Mars')?.orbit ?? 4.1

  const asteroids = useMemo(() => {
    let seed = 918273
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 + (random() - 0.5) * 0.16
      const radius = marsOrbit + ASTEROID_BELT_INNER_GAP + random() * ASTEROID_BELT_WIDTH
      return {
        position: new Vector3(Math.cos(angle) * radius, (random() - 0.5) * 0.22, Math.sin(angle) * radius * 0.985),
        rotation: new Vector3(random() * Math.PI, random() * Math.PI, random() * Math.PI),
        scale: 0.018 + Math.pow(random(), 2.2) * 0.075,
      }
    })
  }, [count, marsOrbit])

  useEffect(() => {
    if (!meshRef.current) return
    const dummy = new Object3D()
    asteroids.forEach((asteroid, index) => {
      dummy.position.copy(asteroid.position)
      dummy.rotation.set(asteroid.rotation.x, asteroid.rotation.y, asteroid.rotation.z)
      dummy.scale.setScalar(asteroid.scale)
      dummy.updateMatrix()
      meshRef.current?.setMatrixAt(index, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [asteroids])

  useFrame((_, delta) => {
    if (!paused && beltRef.current) beltRef.current.rotation.y += delta * 0.008
  })

  return (
    <group ref={beltRef} rotation={[0.025, 0, -0.012]}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8d6550" roughness={0.96} metalness={0} flatShading />
      </instancedMesh>
    </group>
  )
}

type FocusTarget = {
  object: Object3D
  distance: number
  name: string
}

function CameraFocus({
  focus,
  returningHome,
  controlsRef,
  onReturnComplete,
}: {
  focus: FocusTarget | null
  returningHome: boolean
  controlsRef: RefObject<OrbitControlsImpl | null>
  onReturnComplete: () => void
}) {
  const { camera } = useThree()
  const worldPosition = useMemo(() => new Vector3(), [])
  const previousWorldPosition = useMemo(() => new Vector3(), [])
  const planetMovement = useMemo(() => new Vector3(), [])
  const desiredPosition = useMemo(() => new Vector3(), [])
  const viewDirection = useMemo(() => new Vector3(), [])
  const systemTarget = useMemo(() => new Vector3(SUN_X, SUN_Y, 0), [])
  const focusedObject = useRef<Object3D | null>(null)
  const approaching = useRef(false)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls || !focus) return

    const stopApproach = () => {
      focus.object.getWorldPosition(worldPosition)
      focusedObject.current = focus.object
      previousWorldPosition.copy(worldPosition)
      controls.target.copy(worldPosition)
      approaching.current = false
      controls.update()
    }

    controls.addEventListener('start', stopApproach)
    return () => controls.removeEventListener('start', stopApproach)
  }, [controlsRef, focus, previousWorldPosition, worldPosition])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    if (focus) {
      focus.object.getWorldPosition(worldPosition)
      if (focusedObject.current !== focus.object) {
        focusedObject.current = focus.object
        approaching.current = true
        previousWorldPosition.copy(worldPosition)
        viewDirection.copy(camera.position).sub(worldPosition).normalize()
      } else {
        planetMovement.copy(worldPosition).sub(previousWorldPosition)
        camera.position.add(planetMovement)
        controls.target.add(planetMovement)
        previousWorldPosition.copy(worldPosition)
      }

      if (approaching.current) {
        const focusBlend = 1 - Math.exp(-delta * 3.2)
        desiredPosition.copy(worldPosition).addScaledVector(viewDirection, focus.distance)
        controls.target.lerp(worldPosition, focusBlend)
        camera.position.lerp(desiredPosition, focusBlend)
        if (controls.target.distanceTo(worldPosition) < 0.015 && camera.position.distanceTo(desiredPosition) < 0.03) {
          controls.target.copy(worldPosition)
          camera.position.copy(desiredPosition)
          approaching.current = false
        }
      } else {
        controls.target.copy(worldPosition)
      }
      controls.update()
      return
    }

    focusedObject.current = null
    approaching.current = false
    if (!returningHome) return

    const returnBlend = 1 - Math.exp(-delta * 1.05)
    controls.target.lerp(systemTarget, returnBlend)
    camera.position.lerp(HOME_CAMERA_POSITION, returnBlend)
    controls.update()
    if (camera.position.distanceTo(HOME_CAMERA_POSITION) < 0.025 && controls.target.distanceTo(systemTarget) < 0.025) {
      camera.position.copy(HOME_CAMERA_POSITION)
      controls.target.copy(systemTarget)
      controls.update()
      onReturnComplete()
    }
  })

  return null
}

function Planet({
  planet,
  paused,
  labels,
  focused,
  onFocus,
}: {
  planet: PlanetSpec
  paused: boolean
  labels: boolean
  focused: boolean
  onFocus: (target: FocusTarget) => void
}) {
  const planetRef = useRef<Group>(null)
  const orbitAngleRef = useRef(planet.phase)
  const semiMinorAxis = planet.orbit * Math.sqrt(1 - planet.eccentricity * planet.eccentricity)
  const orbitalSpeed = 0.18 / Math.pow(planet.periodYears, 0.4)

  useFrame((_, delta) => {
    if (paused) return
    orbitAngleRef.current += delta * orbitalSpeed
    if (planetRef.current) {
      planetRef.current.position.set(
        Math.cos(orbitAngleRef.current) * planet.orbit,
        0,
        Math.sin(orbitAngleRef.current) * semiMinorAxis,
      )
      planetRef.current.rotation.y += delta * PLANET_SPIN_SPEED
    }
  })

  return (
    <group rotation={[planet.inclination, 0, 0]}>
      <group
        ref={planetRef}
        position={[
          Math.cos(planet.phase) * planet.orbit,
          0,
          Math.sin(planet.phase) * semiMinorAxis,
        ]}
        onClick={(event) => {
          event.stopPropagation()
          if (planetRef.current) onFocus({ object: planetRef.current, distance: Math.max(2.2, planet.size * 4.3), name: planet.name })
        }}
        onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { document.body.style.cursor = '' }}
      >
        <TexturedModel
          url={planet.model}
          textureUrl={planet.texture}
          radius={planet.size}
          ringColor={planet.ringColor}
          flipTextureY={planet.name === 'Earth'}
          stableRing={planet.name === 'Uranus'}
          paused={paused}
        />
        {(planet.name === 'Earth' || planet.name === 'Mars') && (
          <LayeredAtmosphere radius={planet.size} planet={planet.name} />
        )}
        {planet.name === 'Earth' && <Moon paused={paused} labels={labels} />}
        {(labels || focused) && (
          <Html center position={[0, planet.size + 0.34, 0]} distanceFactor={11} zIndexRange={[10, 0]}>
            <span className="planet-label">{planet.name}</span>
          </Html>
        )}
      </group>
    </group>
  )
}

function SolarSystem({ paused, labels, focus, onFocus }: { paused: boolean; labels: boolean; focus: FocusTarget | null; onFocus: (target: FocusTarget) => void }) {
  const systemRef = useRef<Group>(null)

  useFrame(({ pointer }, delta) => {
    if (!systemRef.current || paused || focus) return
    systemRef.current.rotation.x += (pointer.y * 0.09 - systemRef.current.rotation.x) * Math.min(delta * 2.5, 1)
    systemRef.current.rotation.y += (pointer.x * 0.08 - systemRef.current.rotation.y) * Math.min(delta * 2.5, 1)
  })

  return (
    <group ref={systemRef} position={[SUN_X, SUN_Y, 0]} rotation={[0.12, -0.18, -0.12]}>
      <Sun radius={1.32} />
      <pointLight color="#ff8a32" intensity={96} distance={20} decay={2} />
      {planets.map((planet) => (
        <Orbit
          key={`orbit-${planet.name}`}
          radius={planet.orbit}
          eccentricity={planet.eccentricity}
          inclination={planet.inclination}
        />
      ))}
      <AsteroidBelt paused={paused} />
      {planets.map((planet) => (
        <Planet
          key={planet.name}
          planet={planet}
          paused={paused}
          labels={labels}
          focused={focus?.name === planet.name}
          onFocus={onFocus}
        />
      ))}
    </group>
  )
}

function Scene({
  paused,
  labels,
  focus,
  returningHome,
  onFocus,
  onReturnComplete,
}: {
  paused: boolean
  labels: boolean
  focus: FocusTarget | null
  returningHome: boolean
  onFocus: (target: FocusTarget) => void
  onReturnComplete: () => void
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  return (
    <>
      <color attach="background" args={['#03060d']} />
      <fog attach="fog" args={['#03060d', 19, 34]} />
      <SpaceBackdrop paused={paused} />
      <ambientLight intensity={0.72} color="#8fa8d2" />
      <hemisphereLight args={['#9bb9e8', '#2a1714', 0.92]} />
      <directionalLight position={[-8, 7, 12]} color="#a9c8ff" intensity={1.35} />
      <DepthLayers paused={paused} />
      <Suspense fallback={null}><SolarSystem paused={paused} labels={labels} focus={focus} onFocus={onFocus} /></Suspense>
      <CameraFraming focused={Boolean(focus)} />
      <OrbitControls ref={controlsRef} makeDefault enablePan={false} minDistance={1.7} maxDistance={24} minPolarAngle={Math.PI * 0.27} maxPolarAngle={Math.PI * 0.7} target={SUN_TARGET} autoRotate={!paused && !focus && !returningHome} autoRotateSpeed={0.12} dampingFactor={0.06} enableDamping />
      <CameraFocus
        focus={focus}
        returningHome={returningHome}
        controlsRef={controlsRef}
        onReturnComplete={onReturnComplete}
      />
      <AdaptiveDpr pixelated />
      <BloomEffect />
    </>
  )
}

function CameraFraming({ focused }: { focused: boolean }) {
  const { camera, size } = useThree()

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return
    const rightShift = focused ? 0 : size.width <= 520 ? 0.1 : size.width <= 900 ? 0.14 : 0.2
    camera.setViewOffset(size.width, size.height, -size.width * rightShift, 0, size.width, size.height)
    camera.updateProjectionMatrix()
    return () => {
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
    }
  }, [camera, size.width, size.height, focused])

  return null
}

function App() {
  const [paused, setPaused] = useState(false)
  const [labels, setLabels] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focus, setFocus] = useState<FocusTarget | null>(null)
  const [returningHome, setReturningHome] = useState(false)

  const focusPlanet = (target: FocusTarget) => {
    setReturningHome(false)
    setFocus(target)
  }

  const clearFocus = () => {
    if (!focus) return
    setFocus(null)
    setReturningHome(true)
  }

  useEffect(() => {
    if (!focus) return
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setFocus(null)
      setReturningHome(true)
    }
    window.addEventListener('keydown', exitOnEscape)
    return () => window.removeEventListener('keydown', exitOnEscape)
  }, [focus])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) setPaused(true)
  }, [])

  return (
    <main className="experience">
      <div className="scene" aria-hidden="true">
        <Canvas camera={{ position: HOME_CAMERA_POSITION.toArray(), fov: 46, near: 0.1, far: 120 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          <Scene paused={paused} labels={labels} focus={focus} returningHome={returningHome} onFocus={focusPlanet} onReturnComplete={() => setReturningHome(false)} />
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
        <p>{focus ? `Focused on ${focus.name}` : 'Interactive orbit'}</p>
        <div>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? 'Play' : 'Pause'}</button>
          <button type="button" onClick={() => setLabels((value) => !value)} aria-pressed={labels}>{labels ? 'Hide names' : 'Show names'}</button>
          {focus && <button type="button" className="focus-exit" onClick={clearFocus}>Exit focus · Esc</button>}
        </div>
      </aside>

      <div className="drag-hint" aria-hidden="true"><span /> {focus ? 'Drag to orbit · Esc to exit' : 'Drag · click a planet'}</div>
      <div className="side-note left">Curiosity<br />builds<br />better worlds</div>
      <div className="section-anchor" id="projects" aria-hidden="true" />
      <div className="section-anchor" id="about" aria-hidden="true" />
    </main>
  )
}

export default App
