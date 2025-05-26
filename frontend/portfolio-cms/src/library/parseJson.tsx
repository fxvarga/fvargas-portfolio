const parseJsonData = (data: string | object | null | undefined) => {
  if (!data) return null;

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse JSON data:', e);
      return null;
    }
  }

  return data; // Already an object
};
export default parseJsonData;