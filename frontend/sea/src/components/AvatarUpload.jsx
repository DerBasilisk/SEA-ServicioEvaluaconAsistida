import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

function centerAspectCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(imageSrc, crop) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((res) => { image.onload = res; });

  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const size = 400;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, size, size
  );

  return new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
}

export default function AvatarUpload({ currentAvatar, username, size = "lg" }) {
  const { fetchMe } = useAuthStore();
  const inputRef = useRef(null);
  const imgRef = useRef(null);

  const [rawSrc, setRawSrc] = useState(null);   // imagen antes del crop
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sizeClasses = { sm: "w-12 h-12 text-lg", md: "w-16 h-16 text-xl", lg: "w-24 h-24 text-4xl" };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawSrc(ev.target.result);
      if (currentAvatar) {
        setShowConfirm(true); // ya tiene foto → pedir confirmación
      } else {
        setShowModal(true);   // no tiene foto → ir directo al crop
      }
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  };

  const handleUpload = async () => {
    if (!completedCrop || !rawSrc) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawSrc, completedCrop);
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");
      await api.post("/upload/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchMe();
      setShowModal(false);
      setRawSrc(null);
    } catch (err) {
      alert(err.response?.data?.message || "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setShowConfirm(false);
    setRawSrc(null);
    setCrop(null);
    setCompletedCrop(null);
  };

  return (
    <>
      {/* Avatar clickeable */}
      <div
        className="relative group cursor-pointer"
        onClick={() => inputRef.current?.click()}
        title="Cambiar foto de perfil"
      >
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-indigo-800 shadow-lg`}>
          {currentAvatar ? (
            <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white font-black">
              {username?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-lg">📷</span>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Modal de confirmación (si ya tiene foto) */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-white font-black text-lg">¿Cambiar foto de perfil?</h3>
            <p className="text-indigo-400 text-sm">Tu foto actual será reemplazada.</p>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-300 font-bold py-3 rounded-xl transition">
                Cancelar
              </button>
              <button onClick={() => { setShowConfirm(false); setShowModal(true); }}
                className="flex-1 bg-violet-500 hover:bg-violet-400 text-white font-bold py-3 rounded-xl transition">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recorte */}
      {showModal && rawSrc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-white font-black text-lg text-center">Recortar foto de perfil</h3>
            <p className="text-indigo-400 text-xs text-center">Arrastrá y redimensioná el círculo para elegir el área</p>

            <div className="flex justify-center max-h-96 overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                minWidth={50}
              >
                <img
                  ref={imgRef}
                  src={rawSrc}
                  alt="Recortar"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-80 object-contain"
                />
              </ReactCrop>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-300 font-bold py-3 rounded-xl transition">
                Cancelar
              </button>
              <button onClick={handleUpload} disabled={!completedCrop || uploading}
                className="flex-1 bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition active:scale-95">
                {uploading ? "Subiendo..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
