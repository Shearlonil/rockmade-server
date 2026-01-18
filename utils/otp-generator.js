const randomInt = require('node:crypto');

// NOTE: count of digits is 62
let digits =  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Function to generate OTP, ref: https://www.geeksforgeeks.org/javascript-program-to-generate-one-time-password-otp/
const generateOTP = (len = 4) => { 
    // Declare a digits variable  
    // which stores all digits  
    let OTP = '';
    for (let i = 0; i < len; i++) { 
        OTP += digits[Math.floor(Math.random() * digits.length )]; 
    } 
    return OTP; 
}

const gameCodeGenerator = () => {
    // get time in milliseconds
    const milliTime = new Date().valueOf();
    // extract last 10 digits
    let tenDigitId = String(milliTime).substring(3, 13);
    const arr = [];
    // group the ten digits into groups of 2 digits and store each extracted two digits in an array
    for(let exp = 10; tenDigitId / exp > 0; exp *= 10){
        // starting from the rare end, take the next group of 2 digits
        arr.push(tenDigitId % (100));
        // Remove the last 2 digits from tenDigitId
        tenDigitId = Math.floor(tenDigitId / (100));
    }
    const strArr = [];
    arr.forEach(v => {
        // if teh value formed by the group of two digits is greater than 62 (0 - 61), length of digits, then generate random value
        if (v > 61) {
            strArr.push(generateOTP(1));
        }else {
            strArr.push(digits.charAt(v));
        }
    });
    return strArr.join('');
};

module.exports = { generateOTP, gameCodeGenerator };