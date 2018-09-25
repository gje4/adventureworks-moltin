'use strict';

const Moltin = require('../moltin');
const fs = require('fs');
const csv = require('csv');

module.exports = async function(path, catalog) {
  var uniqueBrand = removeDuplicates(catalog.brands, 'brand');

  for (let brand of uniqueBrand) {
    console.log('Creating brand %s', brand.brand);
    if (brand.brand != 'brand') {
    const brandM = await Moltin.Brands.Create({
      type: 'brand',
      name: brand.brand,
      description: brand.brand,
      slug: brand.brand.replace(/[^A-Z0-9]/gi, '_'),
      status: 'live'
    });
    //TODO sub brand logic
  }
  else {
      console.log("skip");
    }
}

  function removeDuplicates(originalArray, prop) {
    var newArray = [];
    var lookupObject = {};

    for (var i in originalArray) {
      lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for (i in lookupObject) {
      newArray.push(lookupObject[i]);
    }
    return newArray;
  }
};
