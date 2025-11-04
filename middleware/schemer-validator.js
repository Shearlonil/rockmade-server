const path = require('path');
const fsPromises = require('fs').promises;

const validate = (schema) => async (req, res, next) => {
    try {
        // throws an error if not valid
        await schema.validate(req.body, { abortEarly: false });
        next();
    } catch (e) {
        // handle file delete in case of multer file upload
        if(req.file){
            await fsPromises.unlink(path.join(__dirname, "..", "cv-upload", req.file.filename));
        }
        return res.status(400).json({ 'message': e.errors });
        // res.status(400).json({ error: e.errors.join(', ') });
    }
}

module.exports = validate;