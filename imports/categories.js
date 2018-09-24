'use strict';

const Moltin = require('../moltin');
const fs = require('fs');
const csv = require('csv');

module.exports = async function(path, catalog) {
  var uniqueCategory = removeDuplicates(catalog.categories, "category");

  for (let category of uniqueCategory) {
    console.log('Creating category %s', category.category);

    const categoryM = await Moltin.Categories.Create({
      type: 'category',
      name: category.category.replace(/[^A-Z0-9]/gi, '_'),
      description: category.category,
      slug: category.category.replace(/[^A-Z0-9]/gi, '_'),
      status: 'live'
    });
//TODO sub category logic

  }

  function removeDuplicates(originalArray, prop) {
     var newArray = [];
     var lookupObject  = {};

     for(var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
     }

     for(i in lookupObject) {
         newArray.push(lookupObject[i]);
     }
      return newArray;
 }

};
