const randomInt = require('node:crypto');
// Function to generate OTP, ref: https://www.geeksforgeeks.org/javascript-program-to-generate-one-time-password-otp/
const generateOTP = (len = 4) => { 
    // Declare a digits variable  
    // which stores all digits  
    let digits =  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
    let OTP = '';
    for (let i = 0; i < len; i++) { 
        OTP += digits[Math.floor(Math.random() * digits.length )]; 
    } 
    return OTP; 
}


// 6 digits, change the random max number and pad length if you need 5 digits, 
// ref: https://stackoverflow.com/questions/67544371/how-to-generate-a-random-number-code-to-confirm-an-email
function randomCode() {
    return randomInt(1000_000).toString().padStart(6, '0');
}

module.exports = generateOTP;