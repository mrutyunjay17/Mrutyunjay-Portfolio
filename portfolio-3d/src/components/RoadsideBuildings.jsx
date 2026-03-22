import { useMemo } from "react"
import * as THREE from "three"
import { getCurveFrame } from "../scene/curveUtils"

function createRng(seed) {
  let value = seed >>> 0
  return function random() {
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomRange(rng, min, max) {
  return min + (max - min) * rng()
}

function getWaveProfile(t, sections) {
  const profile = [0.28, 0.82, 0.44, 0.93, 0.52, 0.88, 0.58]
  if (!sections?.length) {
    const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 5.2 - 0.5)
    return THREE.MathUtils.lerp(0.3, 1, wave)
  }

  let sectionIndex = 0
  for (let i = 0; i < sections.length; i += 1) {
    if (t >= sections[i].checkpointT) sectionIndex = i
    else break
  }

  const zone = profile[sectionIndex % profile.length]
  const micro = 0.5 + 0.5 * Math.sin(t * Math.PI * 3.7 + sectionIndex * 0.5)
  return THREE.MathUtils.lerp(zone * 0.7, zone * 1.12, micro)
}

function generateBuildingsForSide(curve, sections, side, seed) {
  const rng = createRng(seed)
  const buildings = []
  let t = 0.02

  while (t < 0.98) {
    t += randomRange(rng, 0.015, 0.04)
    if (t >= 0.98) break

    const runRoll = rng()
    const clusterSize = runRoll > 0.72 ? 4 : runRoll > 0.35 ? 2 : 1
    const connectedStep = randomRange(rng, 0.005, 0.01)
    const lateralOffset = randomRange(rng, 14.5, 23.5)

    for (let i = 0; i < clusterSize; i += 1) {
      const bt = t + i * connectedStep
      if (bt >= 1) break

      const { point, tangent, normal } = getCurveFrame(curve, bt)
      const wave = getWaveProfile(bt, sections)
      
      const visibleHeight = randomRange(rng, 7, 14) + wave * randomRange(rng, 8, 30)
      const topY = point.y + visibleHeight
      const bottomY = -4
      const height = topY - bottomY

      const width = randomRange(rng, 2.4, 5.2)
      const depth = randomRange(rng, 2.2, 4.8)
      const yaw = Math.atan2(tangent.x, tangent.z)

      const center = point
        .clone()
        .addScaledVector(normal, side * lateralOffset)
      
      center.y = bottomY + height / 2

      const hasAntenna = rng() > 0.5
      const compoundTop = rng() > 0.35 ? {
        width: width * randomRange(rng, 0.4, 0.8),
        height: randomRange(rng, 2, 7),
        depth: depth * randomRange(rng, 0.4, 0.8),
        hasAntenna,
        antennaHeight: hasAntenna ? randomRange(rng, 3, 10) : 0
      } : null

      buildings.push({
        t: bt,
        center,
        yaw,
        width,
        height,
        depth,
        compoundTop,
        litChance: 1,
        colorShift: randomRange(rng, 0.88, 1.2),
        hasBanner: rng() < 0.65,
        bannerSide: rng() > 0.5 ? 1 : -1,
        bannerRow: rng(),
        bannerTone: rng() > 0.5 ? "red" : "yellow",
        borderTone: rng() < 0.33 ? "red" : rng() < 0.66 ? "yellow" : "cyan",
      })
    }

    t += randomRange(rng, 0.01, 0.035)
  }

  return buildings
}

function windowColorFor(indexShift, intensity) {
  const variance = 0.96 + 0.08 * Math.sin(indexShift * 1.73)
  return new THREE.Color("#ffffff").multiplyScalar(intensity * variance)
}

function bannerColorFor(tone, intensity) {
  const palette = {
    red: new THREE.Color("#ff315c"),
    yellow: new THREE.Color("#ffd84b"),
  }
  const color = (palette[tone] ?? palette.red).clone()
  return color.multiplyScalar(intensity)
}

function borderColorFor(tone) {
  const palette = {
    red: new THREE.Color("#ff3b63"),
    yellow: new THREE.Color("#ffe25b"),
    cyan: new THREE.Color("#7fffff"),
  }
  return (palette[tone] ?? palette.cyan).clone()
}

function generateWindowInstances(buildings) {
  const instances = []
  const tempVec = new THREE.Vector3()
  const tempQuat = new THREE.Quaternion()
  const tempScale = new THREE.Vector3(0.11, 0.11, 0.11)

  buildings.forEach((building, buildingIndex) => {
    const cols = Math.max(2, Math.floor(building.depth / 0.7))
    const floors = Math.max(3, Math.floor((building.height - 1.2) / 0.9))
    const zStep = building.depth / cols
    const yStart = -building.height / 2 + 0.55
    const localQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, building.yaw, 0))
    const windowInset = 0.05
    const xFace = building.width / 2 + windowInset

    for (let floor = 0; floor < floors; floor += 1) {
      for (let col = 0; col < cols; col += 1) {
        for (let sideSign = -1; sideSign <= 1; sideSign += 2) {
          const deterministic = Math.sin((buildingIndex + 1) * (floor + 3) * (col + 7) * (sideSign + 2))
          const lit = (deterministic * 0.5 + 0.5) < building.litChance
          if (!lit) continue

          const localPos = new THREE.Vector3(
            sideSign * xFace,
            yStart + floor * 0.9,
            -building.depth / 2 + zStep * (col + 0.5),
          )

          tempVec.copy(localPos).applyQuaternion(localQuat).add(building.center)
          tempQuat.copy(localQuat)

          const matrix = new THREE.Matrix4().compose(tempVec, tempQuat, tempScale)
          const color = windowColorFor(buildingIndex + floor + col, building.colorShift)

          instances.push({ matrix, color })
        }
      }
    }
  })

  return instances
}

export default function RoadsideBuildings({ curve, sections, endT }) {
  const allBuildings = useMemo(() => {
    const left = generateBuildingsForSide(curve, sections, -1, 52319)
    const right = generateBuildingsForSide(curve, sections, 1, 84271)
    return [...left, ...right].sort((a, b) => a.t - b.t)
  }, [curve, sections])

  const visibleBuildings = useMemo(() => {
    const visibleLimit = Math.min(1, endT + 0.08)
    return allBuildings.filter((building) => building.t <= visibleLimit)
  }, [allBuildings, endT])

  const windowInstances = useMemo(() => generateWindowInstances(visibleBuildings), [visibleBuildings])
  const banners = useMemo(() => {
    const result = []
    visibleBuildings.forEach((building, index) => {
      if (!building.hasBanner) return

      const bannerHeight = building.height * 0.42
      const bannerWidth = building.depth * 0.58
      const bannerThickness = 0.09
      const yMin = -building.height / 2 + bannerHeight / 2 + 0.5
      const yMax = building.height / 2 - bannerHeight / 2 - 0.5
      const y = THREE.MathUtils.lerp(yMin, yMax, building.bannerRow)
      const z = 0
      const x = building.bannerSide * (building.width / 2 + bannerThickness / 2 + 0.05)
      const color = bannerColorFor(building.bannerTone, THREE.MathUtils.lerp(1.1, 1.45, building.colorShift - 0.88))

      result.push({
        id: `${building.t}-${index}`,
        center: building.center,
        yaw: building.yaw,
        x,
        y,
        z,
        width: bannerThickness,
        height: bannerHeight,
        depth: bannerWidth,
        color,
      })
    })

    return result
  }, [visibleBuildings])

  const buildingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#04050a",
        roughness: 0.22,
        metalness: 0.88,
      }),
    [],
  )

  const windowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        toneMapped: false,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  )

  const borderGeometry = useMemo(() => {
    const base = new THREE.BoxGeometry(1, 1, 1)
    return new THREE.EdgesGeometry(base)
  }, [])

  const antennaGeometry = useMemo(() => {
    const base = new THREE.BoxGeometry(0.08, 1, 0.08)
    return new THREE.EdgesGeometry(base)
  }, [])

  return (
    <group>
      {visibleBuildings.map((building, idx) => (
        <group
          key={`${building.t}-${idx}`}
          position={building.center}
          rotation={[0, building.yaw, 0]}
        >
          <mesh material={buildingMaterial}>
            <boxGeometry args={[building.width, building.height, building.depth]} />
          </mesh>

          {building.compoundTop && (
            <mesh material={buildingMaterial} position={[0, building.height / 2 + building.compoundTop.height / 2, 0]}>
              <boxGeometry args={[building.compoundTop.width, building.compoundTop.height, building.compoundTop.depth]} />
            </mesh>
          )}

          {building.compoundTop?.hasAntenna && (
            <lineSegments
              geometry={antennaGeometry}
              position={[0, building.height / 2 + building.compoundTop.height + building.compoundTop.antennaHeight / 2, 0]}
              scale={[1, building.compoundTop.antennaHeight, 1]}
            >
              <lineBasicMaterial color={borderColorFor(building.borderTone)} toneMapped={false} />
            </lineSegments>
          )}

          {!building.hasBanner && (
            <lineSegments
              geometry={borderGeometry}
              scale={[building.width * 1.01, building.height * 1.01, building.depth * 1.01]}
            >
              <lineBasicMaterial
                color={borderColorFor(building.borderTone)}
                toneMapped={false}
                transparent
                opacity={0.92}
              />
            </lineSegments>
          )}
        </group>
      ))}

      {windowInstances.length > 0 && (
        <instancedMesh
          args={[new THREE.BoxGeometry(1, 1, 1), windowMaterial, windowInstances.length]}
          frustumCulled={false}
          ref={(mesh) => {
            if (!mesh) return
            windowInstances.forEach((instance, i) => {
              mesh.setMatrixAt(i, instance.matrix)
              mesh.setColorAt(i, instance.color)
            })
            mesh.instanceMatrix.needsUpdate = true
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
          }}
        />
      )}

      {banners.map((banner) => (
        <group
          key={banner.id}
          position={banner.center}
          rotation={[0, banner.yaw, 0]}
        >
          <mesh position={[banner.x, banner.y, banner.z]}>
            <boxGeometry args={[banner.width, banner.height, banner.depth]} />
            <meshStandardMaterial
              color={banner.color}
              emissive={banner.color}
              emissiveIntensity={3.5}
              roughness={0.1}
              metalness={0.5}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
