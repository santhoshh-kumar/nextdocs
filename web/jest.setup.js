import '@testing-library/jest-dom';

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    if (obj instanceof Uint8Array) {
      return new Uint8Array(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => global.structuredClone(item));
    }
    if (obj && typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = global.structuredClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  };
}
