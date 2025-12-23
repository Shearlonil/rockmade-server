// ref: https://www.saurabhmisra.dev/file-uploads-nodejs/
const path = require('path');
const multer = require('multer');
const mimetype = require('./mime-types.json');

/*  configure a max limit on the uploaded file size
    1024 * 1024 = 1 mb
    20 * 1024 * 1024 = 20MB
*/   
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;  // 5MB
// configure multer to save files to disk.
const fileStorageEngine = multer.diskStorage({
  
    // configure the destination directory 
    destination: (req, file, cb) => {
        cb(null, 'file-upload');
    },
  
    // configure the destination filename
    filename: ( req, file, callback ) => {
        callback( null, file.originalname );
    }
  
});

// configure multer to handle single file uploads
const uploadSingleFile = multer({

    // use the configured file storage option
    storage: fileStorageEngine,

    // skip any files that do not meet the validation criteria
    fileFilter: ( req, file, callback ) => {
        
        if ( file.mimetype !== mimetype['jpg'] && file.mimetype !== mimetype['jpeg'] ) {
        
            // Store a flag to denote that this file is invalid.
            // Unlike `res.locals`, `req.locals` is not really 
            // a standard express object but we use it here
            // for convenience to pass data to the route handler.
            // req.locals = { invalidFileFormat: true };
            req.body.invalidFileFormat = true;

            // reject this file. The return keyword is important to make this work, else multer will report the error but still go ahead to upload the file
            return callback( new Error("Error: Unsupported file format"), false );
        }

        // accept this file
        callback( null, true );

    }, 
    limits: { fileSize: MAX_UPLOAD_SIZE }

}).single( "img" );

const multerImgUpload = ( req, res, next ) => {
    // `uploadSingleFile` is a middleware but we use it here 
    // inside the route handler because we want to handle errors.
    uploadSingleFile( req, res, err => {      
        // if uploaded file size is too large or if its format is invalid
        // then respond with a 400 Bad Request HTTP status code.
        if( err instanceof multer.MulterError || ( req.body.invalidFileFormat )) {
            return res.status( 400 ).json({ 
                status: "error", 
                // message: err
                message: `${err.message}` 
            });
        }
  
        // handle any other generic error
        else if ( err ) {
            return res.status( 500 ).json({ 
                status: "error", 
                message: "Something went wrong while uploading the file.", 
                detail: err 
            });
        }
  
        next();
    });
};

module.exports = multerImgUpload;