import RefillHeartsButton from "./Refillheartsbutton";

export default function NoHeartsPanel({ onRefilled, onContinue }) {
  return (
    <div className="w-full bg-red-900 border-2 border-red-500 rounded-2xl p-6 text-center">
      <div className="text-5xl mb-3">💔</div>
      <h3 className="text-red-300 font-black text-xl mb-2">¡Sin vidas!</h3>
      <p className="text-indigo-300 text-sm mb-5">
        Te quedaste sin corazones. Recargá con gemas o terminá la lección.
      </p>

      <div className="flex flex-col gap-3">
        <RefillHeartsButton onRefilled={onRefilled} />
        <button
          onClick={onContinue}
          className="w-full bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-indigo-300 font-bold py-3 rounded-xl transition"
        >
          Terminar lección igual
        </button>
      </div>
    </div>
  );
}