'use strict';

const _ = require('lodash');
const Moltin = require('../moltin');

module.exports = async function(path, products) {
  // there are only 42 unique images in AW
  // so no need to worry about offset and limits (the default is 100)
  const imagesM = await Moltin.Files.All();

  const images = _.chain(products)
    .flatMap(product => product.variants)
    .map(variant => variant.image.large_filename)
    .uniq()
    .filter(file => !imagesM.data.some(i => i.file_name === file))
    .value();

  if (images.length === 0) {
    return imagesM.data;
  }

  for (let image of images) {
    console.log('Uploading %s', image);

    try {
      const imageM = await Moltin.Files.Create(`${path}/images/${image}`);
    } catch (error) {
      if (Array.isArray(error)) {
        error.forEach(console.error);
      } else {
        console.error(error);
      }
    }
  }

  // re-read images
  return (await Moltin.Files.All()).data;
};
