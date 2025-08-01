const zxcvbn = require("zxcvbn");


const MIN_PASSWORD_LENGTH = 8;

const validatePassword = (password) => {
    const errors = []

    // 1. Length requirement
    if (password.length < MIN_PASSWORD_LENGTH){
        errors.push(`New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    }

    // 2. Contains number
    if(!/\d/.test(password)){
        errors.push("Password requires a number at least.")
    }

    // 3. Contains uppercase letter
    if(!/[A-Z]/.test(password)) {
        errors.push("Password requires an upper letter at least.")
    }

    // 4. Check against common/weak passwords using zxcvbn
    const passwordStrength = zxcvbn(password);
    // score 0: too guessable; 1: very guessable; 2: somewhat guessable; 3: safely unguessable; 4: very unguessable
    if (passwordStrength.score < 1){
        errors.push("Password is too weak and is often used. Please use a stronger password.")
    }



    // Alternative to external library
    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'test', 'password', 'cat', 'dog'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push("Password is too common. Please use an unique password.");
    }

    return errors; 
}

module.exports = { validatePassword };
