import * as jwtModule from 'jwt-decode';

// Normalize possible module shapes (CommonJS default vs ESM named exports)
const getDecoder = () => {
  // If the module itself is a function (rare), use it
  if (typeof jwtModule === 'function') return jwtModule;
  // If default export is function
  if (jwtModule && typeof jwtModule.default === 'function') return jwtModule.default;
  // Some builds export a named 'jwtDecode' or 'jwt_decode'
  if (jwtModule && typeof jwtModule.jwtDecode === 'function') return jwtModule.jwtDecode;
  if (jwtModule && typeof jwtModule.jwt_decode === 'function') return jwtModule.jwt_decode;
  // Fallback: try to use the module object as function (may throw)
  try {
    // eslint-disable-next-line no-new-func
    return jwtModule;
  } catch (e) {
    return () => null;
  }
};

const decoder = getDecoder();

export default function jwtDecode(token) {
  if (!token) return null;
  try {
    return decoder(token);
  } catch (e) {
    // If decoding fails, return null and let caller handle it
    return null;
  }
}
