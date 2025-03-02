import crypto from 'crypto';

export const encrypt = async (data: string, salt: string) => {
    const encoder = new TextEncoder();
    const combinedData = salt + data;
    const dataBuffer = encoder.encode(combinedData);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert hash to hex string
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}