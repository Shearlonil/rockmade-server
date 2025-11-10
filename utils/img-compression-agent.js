const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const sharp = require("sharp");
const { encode } = require('blurhash');

/*  ref: 
    https://blog.opinly.ai/image-optimisation-with-sharp-in-nodejs/
    https://stackoverflow.com/questions/47547824/how-do-i-access-an-image-from-the-node-js-sharp-module-buffer
    https://www.digitalocean.com/community/tutorials/how-to-process-images-in-node-js-with-sharp
*/
const compress = async (filePath) => {
    const sharpImage = sharp(filePath);

    const resizedImage = await resizeImage(sharpImage);

    return await resizedImage.webp().toBuffer();
}

const resizeImage = async (sharpImage) => {
    const metadata = await sharpImage.metadata();

    // Calculate the maximum dimensions
    const maxWidth = 16383;
    const maxHeight = 16383;

    if (!metadata.width) {
        throw new Error("No metadata width found for image");
    }

    if (!metadata.height) {
        throw new Error("No metadata height found for image");
    }

    // Determine whether resizing is necessary
    const needsResize = metadata.width > maxWidth || metadata.height > maxHeight;

    let resizedImage = sharpImage;

    if (needsResize) {
        // Calculate the new size maintaining the aspect ratio
        const aspectRatio = metadata.width / metadata.height;
        let newWidth = maxWidth;
        let newHeight = maxHeight;

        if (metadata.width > metadata.height) {
        // Landscape or square image: scale by width
        newHeight = Math.round(newWidth / aspectRatio);
        } else {
        // Portrait image: scale by height
        newWidth = Math.round(newHeight * aspectRatio);
        }

        // Resize the image before converting to WebP
        resizedImage = sharpImage.resize(newWidth, newHeight);
    }

    return resizedImage;
}

const encodeImageToBlurhash = async img => {
    /*  ref: https://blog.opinly.ai/image-optimisation-with-sharp-in-nodejs/
        https://www.digitalocean.com/community/tutorials/how-to-process-images-in-node-js-with-sharp
        https://hamon.in/blog/blurhash/
        https://harshpathak.hashnode.dev/creating-mesmerizing-visual-experiences-a-beginners-guide-to-image-blurring-with-blurhash
    */
    const { data, info } = await sharp(img).ensureAlpha().raw().toBuffer({
        resolveWithObject: true,
    });

    const encoded = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        4,
        4
    );

    return {
        hash: encoded,
        height: info.height,
        width: info.width,
    };
};

module.exports = {
    compress,
    encodeImageToBlurhash
};