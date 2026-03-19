import { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

const BANNER_ASPECT = 1200 / 300; // 4:1

function centerBannerCrop(w, h) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 100 }, BANNER_ASPECT, w, h),
    w, h
  );
}

async function getCroppedBlob(imageSrc, crop) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((res) => { image.onload = res; });

  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = 1200;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, 1200, 300
  );
  return new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
}

export default function BannerUpload({ currentBanner }) {
  const { fetchMe } = useAuthStore();
  const inputRef = useRef(null);

  const [rawSrc, setRawSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawSrc(ev.target.result);
      if (currentBanner) {
        setShowConfirm(true);
      } else {
        setShowModal(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerBannerCrop(width, height));
  };

  const handleUpload = async () => {
    if (!completedCrop || !rawSrc) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawSrc, completedCrop);
      const formData = new FormData();
      formData.append("banner", blob, "banner.jpg");
      await api.post("/upload/banner", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchMe();
      setShowModal(false);
      setRawSrc(null);
    } catch (err) {
      alert(err.response?.data?.message || "Error al subir el banner");
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
      {/* Banner */}
      <div
        className="relative group cursor-pointer w-full h-32 overflow-hidden bg-gradient-to-r from-violet-800 to-indigo-800"
        onClick={() => inputRef.current?.click()}
        title="Cambiar banner"
      >
        {currentBanner ? (
          <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-indigo-400 text-sm">Click para agregar banner</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-sm font-bold">📷 {currentBanner ? "Cambiar banner" : "Agregar banner"}</span>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-white font-black text-lg">¿Cambiar el banner?</h3>
            <p className="text-indigo-400 text-sm">Tu banner actual será reemplazado.</p>
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
          <div className="bg-indigo-900 border border-indigo-700 rounded-2xl p-6 w-full max-w-2xl space-y-4">
            <h3 className="text-white font-black text-lg text-center">Recortar banner</h3>
            <p className="text-indigo-400 text-xs text-center">Arrastrá el área para elegir qué parte usar como banner (proporción 4:1)</p>

            <div className="flex justify-center max-h-80 overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={BANNER_ASPECT}
                minWidth={100}
              >
                <img
                  src={rawSrc}
                  alt="Recortar"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-72 object-contain"
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
