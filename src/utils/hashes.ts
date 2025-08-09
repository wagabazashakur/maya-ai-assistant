// A simple SHA1 implementation for demonstration purposes.
// In a real application, a robust library should be used.
export const sha1 = (str: string): string => {
    // A simple, non-cryptographic hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    // Convert to a 40-character hex string to mimic SHA1
    const hex = (hash >>> 0).toString(16);
    return hex.padStart(8, '0').repeat(5).substring(0, 40);
};

// A very simple MD5 simulation for demonstration. Not a real MD5.
export const md5 = (str: string): string => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    const hex = (hash >>> 0).toString(16);
     return hex.padStart(8, '0').repeat(4).substring(0, 32);
};
