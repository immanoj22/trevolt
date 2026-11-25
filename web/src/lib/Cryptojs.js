/**PACKAGE */
import CryptoJS from 'crypto-js';

export const encryptObject = (encryptValue, SecretKey) => {
    try {
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(encryptValue), SecretKey).toString();
        // console.log("ciphertext : ", ciphertext)
        
        return ciphertext
    }
    catch (err) {
        return ''
    }
}

export const decryptObject = (decryptValue, SecretKey) => {
    try {
        // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
        let bytes = CryptoJS.AES.decrypt(decryptValue, SecretKey);
        // console.log(bytes, 'decryptObject')
        let decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        // console.log(decryptedData, 'decryptObject', bytes.toString(CryptoJS.enc.Utf8))
        return decryptedData
    }
    catch (err) {
        console.log(err, 'decryptObject__err')
        return ''
    }
}
