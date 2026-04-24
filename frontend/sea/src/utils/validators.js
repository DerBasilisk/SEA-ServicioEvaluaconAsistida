export const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s().,:\-']+$/;

export const validarNombre = (valor) => {
  const trimmed = valor?.trim();
  return trimmed && NOMBRE_REGEX.test(trimmed);
};

export const NOMBRE_ERROR = "El nombre solo puede contener letras, tildes y caracteres básicos. No se permiten números ni símbolos especiales.";