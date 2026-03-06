import Scene from "./scene/Scene"

export default function App() {
  return (
    <div style={{ height: "700vh" }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
        }}
      >
        <Scene />
      </div>
    </div>
  )
}