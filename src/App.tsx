import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./App.css";
import { addNombre, fetchNombres } from "./services/nombres";

const App = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [nombres, setNombres] = useState<string[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");

  useEffect(() => {
    fetchNombres().then(setNombres);
  }, []);

  const handleAgregar = async () => {
    if (!nuevoNombre) return;
    await addNombre(nuevoNombre);
    setNombres((prev) => [...prev, nuevoNombre]);
    setNuevoNombre("");
  };

  useEffect(() => {
    if (!audioRef.current) {
      // Crear audio solo una vez
      const audio = new Audio("/audio/navidad.mp3");
      audio.loop = true;
      audio.volume = 0.3;
      audioRef.current = audio;
    }

    const startAudio = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch((err) => console.log(err));
      }
      window.removeEventListener("click", startAudio);
    };

    window.addEventListener("click", startAudio);

    // Cleanup
    return () => {
      window.removeEventListener("click", startAudio);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    if (mountRef.current) {
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    }

    /* ===== ESCENA ===== */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x021b14);

    /* ===== CÁMARA ===== */
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 3, 10);

    /* ===== RENDER ===== */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    /* ===== LUCES ===== */
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    /* ===== CONTROLES ===== */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    /* ===== MODELO ===== */
    const loader = new GLTFLoader();
    const modelGroup = new THREE.Group(); // para girar árbol + adornos
    scene.add(modelGroup);

    loader.load("/modelo_3d.glb", (gltf) => {
      const model = gltf.scene;

      // Bounding box
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Escalar y centrar
      const desiredHeight = 4;
      const scale = desiredHeight / size.y;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.y += desiredHeight / 2 - center.y * scale;

      modelGroup.add(model);

      // Ajustar target de controles
      controls.target.set(0, desiredHeight / 2, 0);
      controls.update();

      // Adornos con nombres
      nombres.forEach((nombre) => {
        console.log("creando sprite");
        // Crear canvas con el nombre
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "yellow"; // color amarillo

        ctx.font = "18px JetBrains Mono";
        ctx.textAlign = "center";

        ctx.fillText(nombre, 128, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: texture })
        );
        sprite.scale.set(2, 0.5, 1); // tamaño del sprite

        // Posición aleatoria sobre el árbol
        sprite.position.set(
          (Math.random() - 0.5) * 5, // x
          Math.random() * desiredHeight, // y
          (Math.random() - 0.5) * 7 // z
        );

        modelGroup.add(sprite); // añadir al grupo del árbol
        console.log("creado sprite");
      });
    });

    /* ===== ANIMACIÓN ===== */
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Girar automáticamente
      modelGroup.rotation.y += 0.002;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    /* ===== RESPONSIVE ===== */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    /* ===== CLEANUP ===== */
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();

      while (mountRef.current?.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    };
  });

  /* ===== SCROLL PARA MOSTRAR EL ÁRBOL ===== */
  return (
    <>
      <div
        style={{
          backgroundColor: "#021B14",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 15px",
          flexWrap: "wrap",
        }}
      >
        <p style={{ fontSize: "8px" }}>@DevMaik</p>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Ingresa tu nombre"
          />
          <button onClick={handleAgregar}>Agregar</button>
        </div>
      </div>

      <h1
        style={{
          position: "fixed",
          top: 50,
          left: 0,
          width: "100%",
          height: "60px",
          zIndex: 10,
          fontSize: "25px", // más grande
          fontWeight: "bold",
          fontFamily: "'JetBrains Mono','Comic Sans MS', cursive, sans-serif",
          textAlign: "center",
          color: "white",
          backgroundColor: "trasparent",
          textShadow: `
      0 0 10px #00ffff,
      0 0 20px #ffffff,
      0 0 30px #0000ff,
      0 0 40px #ffffff,
      0 0 50px #00ffff
    `,
          animation: "sistemas 2s infinite alternate", // animación de cambio de color
        }}
      >
        ING. SISTEMAS - UPEA
      </h1>

      <h1
        className="titulo"
        style={{
          position: "fixed",
          top: 60,
          left: 0,
          width: "100%",
          height: "60px",
          zIndex: 10,
          fontSize: "70px", // más grande
          fontWeight: "bold",
          fontFamily:
            "'Mountains of Christmas','JetBrains Mono','Comic Sans MS', cursive, sans-serif",
          textAlign: "center",
          color: "red",
          backgroundColor: "trasparent",
          textShadow: `
      0 0 10px #ff0000,
      0 0 20px #00ff00,
      0 0 30px #ffff00,
      0 0 40px #ff00ff,
      0 0 50px #00ffff
    `,
          animation: "navidad 2s infinite alternate", // animación de cambio de color
        }}
      >
        FELIZ NAVIDAD
      </h1>

      <div style={{ height: "100vh" }}>
        <div
          ref={mountRef}
          style={{ width: "100vw", height: "80vh", position: "relative" }}
        />
      </div>
    </>
  );
};

export default App;
