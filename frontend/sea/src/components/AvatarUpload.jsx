import { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import { Camera, AlertTriangle, Check, X } from "lucide-react";
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

export default function AvatarUpload({ currentAvatar, username, size = "lg" }) {
  const { fetchMe } = useAuthStore();
  const inputRef = useRef(null);
  const [rawSrc, setRawSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sizeClasses = { 
    sm: "w-12 h-12 text-sm", 
    md: "w-20 h-20 text-xl", 
    lg: "w-32 h-32 text-4xl" 
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawSrc(ev.target.result);
      if (currentAvatar) setShowConfirm(true);
      else setShowModal(true);
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
      formData.append("avatar", blob, "avatar.jpg");
      await api.post("/upload/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchMe();
      handleCancel();
    } catch (err) {
      alert("Error al subir imagen");
    } finally { setUploading(false); }
  };

  const handleCancel = () => {
    setShowModal(false); setShowConfirm(false); setRawSrc(null); setCrop(null);
  };

  return (
    <>
      <div className="relative group cursor-pointer inline-block" onClick={() => inputRef.current?.click()}>
        <div className={`${sizeClasses[size]} rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl bg-white relative z-10`}>
          {currentAvatar ? (
            <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[#2B7FE8] font-black italic">
              {username?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-[#0F2547]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
            <Camera className="text-white" size={24} />
          </div>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* MODAL DE CONFIRMACIÓN */}
{showConfirm && (
  <div className="fixed inset-0 bg-[#0F2547]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white flex flex-col items-center animate-in zoom-in-95 duration-200"
         style={{ width: '400px', maxWidth: '95vw', minHeight: '300px' }}>
      
      <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-6">
        <AlertTriangle size={40} />
      </div>
      
      <h3 className="text-[#0F2547] font-black italic uppercase text-2xl mb-2 text-center">
        ¿Actualizar Foto?
      </h3>
      
      <p className="text-[#7A9CC5] text-[11px] font-bold mb-8 uppercase tracking-widest text-center leading-relaxed">
        Tu identidad visual actual <br/> será reemplazada en el nexo.
      </p>
      
      <div className="flex gap-3 w-full mt-auto">
        <button onClick={handleCancel} className="flex-1 py-4 rounded-2xl bg-slate-100 text-[#7A9CC5] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
          Cancelar
        </button>
        <button onClick={() => { setShowConfirm(false); setShowModal(true); }} className="flex-1 py-4 rounded-2xl bg-[#2B7FE8] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:brightness-110 transition-all">
          Continuar
        </button>
      </div>
    </div>
  </div>
)}

{/* MODAL DE RECORTE */}
{showModal && rawSrc && (
  <div className="fixed inset-0 bg-[#0F2547]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white flex flex-col animate-in zoom-in-95 duration-200"
         style={{ width: '550px', maxWidth: '95vw' }}>
      
      <h3 className="text-[#0F2547] font-black italic uppercase text-center text-xl mb-6">
        Ajustar Perfil
      </h3>
      
      <div className="flex justify-center mb-8 bg-slate-50 rounded-2xl p-4 overflow-hidden border border-slate-100 shadow-inner w-full">
        <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={1}>
          <img src={rawSrc} alt="Crop" onLoad={e => setCrop(centerAspectCrop(e.currentTarget.width, e.currentTarget.height))} 
               className="max-h-[350px] w-auto object-contain" />
        </ReactCrop>
      </div>

      <div className="flex gap-4 w-full">
        <button onClick={handleCancel} className="flex-1 py-4 rounded-2xl bg-slate-100 text-[#7A9CC5] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
          <X size={14}/> Cancelar
        </button>
        <button onClick={handleUpload} disabled={uploading} className="flex-1 py-4 rounded-2xl bg-[#2B7FE8] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
          <Check size={14}/> {uploading ? "Subiendo..." : "Finalizar"}
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}