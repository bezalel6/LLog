// global.d.ts
export {}; // This ensures this is an ES6 module
declare global {
  interface Window {
    google: any;
    onCredentialResponse: (res: any) => void;
  }
}
