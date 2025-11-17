const crypto = require('crypto');

const encrypt = (text) => {
    /*  refs: 
        https://www.makeuseof.com/nodejs-crypto-module-guide/
        https://medium.com/@tony.infisical/guide-to-nodes-crypto-module-for-encryption-decryption-65c077176980
        https://www.geeksforgeeks.org/node-js-crypto-createcipheriv-method/
    */

    // create cipher object
    const cipher = crypto.createCipheriv("aes-256-cbc", 
        Buffer.from(process.env.MAIL_CRYPTO_SECRET, 'base64'),
        Buffer.from(process.env.CRYPTO_IV, 'base64'));

    // encrypt the data
    let encryptedText = cipher.update(text, "utf-8", "base64");
    
    // finalize the encryption
    encryptedText += cipher.final("base64");
    return encryptedText;
}

const decrypt = (encryptedText) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", 
        Buffer.from(process.env.MAIL_CRYPTO_SECRET, 'base64'), 
        Buffer.from(process.env.CRYPTO_IV, 'base64'));
    
    // decrypt the data
    let decrypted = decipher.update(encryptedText, "base64", "utf-8");
    
    // finalize the decryption
    decrypted += decipher.final("utf-8");
    return decrypted;
}

module.exports = {
    decrypt,
    encrypt,
};