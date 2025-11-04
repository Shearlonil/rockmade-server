// ref to the three methods below: https://stackoverflow.com/questions/23691194/node-express-file-upload
const express = require('express');
var app = express();
var fs = require('fs');
// const File = require("../models/file");
const path = require('path');

// 1.
exports.localFileUpload = async (req, res) => {
    try {
        let sampleFile = req.files.sampleFile;
        console.log("File uploaded:", sampleFile);

        let uploadPath = path.join(__dirname, "/files", Date.now() + "_" + sampleFile.name);
        console.log("Upload path:", uploadPath);

        sampleFile.mv(uploadPath, function(err) {
        if (err) {
            console.log(err);
            return res.status(500).json({
            success: false,
            });
        }
        });

        return res.json({
        success: true,
        message: "File uploaded successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
        success: false,
        message: 'Server Error',
        });
    }
}

// 2.
app.post('/upload', async function(req, res) {

    var file = JSON.parse(JSON.stringify(req.files))

    var file_name = file.file.name

    //if you want just the buffer format you can use it
    var buffer = new Buffer.from(file.file.data.data)

    //uncomment await if you want to do stuff after the file is created

    /*await*/
    fs.writeFile(file_name, buffer, async(err) => {

        console.log("Successfully Written to File.");


        // do what you want with the file it is in (__dirname + "/" + file_name)

        console.log("end  :  " + new Date())

        console.log(result_stt + "")

        fs.unlink(__dirname + "/" + file_name, () => {})
        res.send(result_stt)
    });
});

// 3. using a express-fileupload library
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

// default options
app.use(fileUpload());

app.post('/upload', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.sampleFile;

    uploadPath = __dirname + '/uploads/' + sampleFile.name;

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function(err) {
        if (err)
        return res.status(500).send(err);

        res.send('File uploaded!');
    });
});