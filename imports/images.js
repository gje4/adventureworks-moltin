'use strict';

const fs = require('fs');
const _ = require('lodash');
const Moltin = require('../moltin');
const request = require('request');
const download = require('image-downloader')
const convertImages = require('../data/convert-images');
const path = require('path')


module.exports = async function(path, products) {
  // there are only 42 unique images in AW
  // so no need to worry about offset and limits (the default is 100)
  const imagesM = await Moltin.Files.All();

  for (let image of products) {
    console.log('Uploading %s', image.image_url);
		var fileFormat = image.image_url;
		const dest = `data/temp/${image.sku}.jpg`

		if (image.image_url != "image_url")
		{
			var fileFormat = '.jpg';
			const options = {
			  url: image.image_url,
			  dest: dest
			}

	// imageDownloader(options)
	 await download.image(options)
			  .then(({ filename, image }) => {
					console.log('File saved to', filename)
						try {
								const imageM =  Moltin.Files.Create(filename);
								//Delete all the files from localstorage
								fs.access(dest, error => {
										if (!error) {
												fs.unlinkSync(dest);
										} else {
												console.log(error);
										}
								});
						} catch (error) {
						if (Array.isArray(error)) {
									error.forEach(console.error);
							}
							else {
									console.error(error);
									}
							}
			  })
			  .catch((err) => {
			    console.error('error', err)
			  })
			}
			else {
				console.log('skip %s', image.image_url);
			}
		};

  // re-read images
  return (await Moltin.Files.All()).data;
};
