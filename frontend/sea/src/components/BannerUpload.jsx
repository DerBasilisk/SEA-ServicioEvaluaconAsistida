import { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import { Camera, Image as ImageIcon, Check, X } from "lucide-react";
import "react-image-crop/dist/ReactCrop.css";
import api from "../api/axios";
import useAuthStore from "../store/authStore";

const BANNER_ASPECT = 1200 / 300;

function centerBannerCrop(w, h) {
  return centerCrop(makeAspectCrop({ unit: "%", width: 100 }, BANNER_ASPECT, w, h), w, h);
}

async function getCroppedBlob(imageSrc, crop) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((res) => { image.onload = res; });

  const canvas = document.createElement("canvas");
  const size = 400;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // crop viene en porcentaje si unit="%" o en píxeles si unit="px"
  // ReactCrop onComplete devuelve píxeles relativos al elemento renderizado
  // necesitamos escalar a píxeles naturales
  const imgEl = document.querySelector("img[alt='Crop']");
  const scaleX = image.naturalWidth / (imgEl?.width || image.naturalWidth);
  const scaleY = image.naturalHeight / (imgEl?.height || image.naturalHeight);

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0, 0, size, size
  );

  return new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.92));
}

export default function BannerUpload({ currentBanner }) {
  const imgRef = useRef(null);
  const { fetchMe } = useAuthStore();
  const inputRef = useRef(null);
  const [rawSrc, setRawSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawSrc(ev.target.result);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
    } catch (err) { alert("Error al subir banner"); }
    finally { setUploading(false); }
  };

  return (
    <>
      <div 
        className="relative group cursor-pointer w-full h-40 bg-slate-50 overflow-hidden" 
        onClick={() => inputRef.current?.click()}
      >
        {currentBanner ? (
          <img src={currentBanner} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 border-b-2 border-dashed border-slate-200">
            <ImageIcon className="text-slate-300" size={32} />
            <p className="text-[#7A9CC5] text-[10px] font-black uppercase tracking-widest">Establecer Fondo de Perfil</p>
          </div>
        )}
        <div className="absolute inset-0 bg-[#0F2547]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
          <div className="bg-white/20 border border-white/40 px-6 py-2 rounded-full backdrop-blur-md">
             <span className="text-white text-[10px] font-black uppercase tracking-widest">Cambiar Cover</span>
          </div>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {showModal && rawSrc && (
        <div className="fixed inset-0 bg-[#0F2547]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl border border-white">
            <h3 className="text-[#0F2547] font-black italic uppercase text-center mb-6">Ajustar Banner</h3>
            <div className="bg-slate-50 rounded-3xl p-4 overflow-hidden border border-slate-100 mb-8">
              <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={BANNER_ASPECT}>
                <img
                  ref={imgRef}
                  src={rawSrc}
                  alt="Crop"
                  onLoad={e => setCrop(centerAspectCrop(e.currentTarget.width, e.currentTarget.height))}
                  className="max-h-[350px] w-auto object-contain"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-[#7A9CC5] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><X size={14}/> Cancelar</button>
              <button onClick={handleUpload} disabled={uploading} className="flex-1 py-4 rounded-2xl bg-[#2B7FE8] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-200"><Check size={14}/> {uploading ? "Subiendo..." : "Guardar Cambios"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}