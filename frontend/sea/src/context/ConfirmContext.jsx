// src/context/ConfirmContext.jsx
import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

const ConfirmContext = createContext(null);

/**
 * Envuelve tu <App /> con esto (junto a tus otros providers).
 * Expone useConfirm(), que devuelve una función `confirm` que se usa
 * igual que window.confirm, pero es async y muestra un modal propio.
 *
 * Uso simple (string):
 *   if (!(await confirm("¿Eliminar amigo?"))) return;
 *
 * Uso con opciones (recomendado para acciones destructivas):
 *   const ok = await confirm({
 *     title: "Eliminar usuario",
 *     message: "Esto borrará todo su progreso. Esta acción no se puede deshacer.",
 *     confirmText: "Eliminar",
 *     cancelText: "Cancelar",
 *     danger: true,
 *   });
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, options: {} });
  const resolver = useRef(null);

  const confirm = useCallback((optionsOrMessage) => {
    const options =
      typeof optionsOrMessage === "string"
        ? { message: optionsOrMessage }
        : optionsOrMessage || {};

    setState({ open: true, options });

    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleClose = useCallback((result) => {
    setState((s) => ({ ...s, open: false }));
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        open={state.open}
        title={state.options.title}
        message={state.options.message}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        danger={state.options.danger}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx;
}