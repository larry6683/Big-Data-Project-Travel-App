// Global type declarations for asset imports

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.sass' {
  const content: string;
  export default content;
}

// MapLibre GL CSS
declare module 'maplibre-gl/dist/maplibre-gl.css' {
  const content: string;
  export default content;
}
