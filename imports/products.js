'use strict';

const _ = require('lodash');
const variations = require('./variations');
const images = require('./images');
const Moltin = require('../moltin');

module.exports = async function(path, catalog) {
  const categoriesM = (await Moltin.Categories.Tree()).data;
  var products = []
  console.log("cats", categoriesM)

  //only do varients if they are dataMapPassed
  if(catalog.inventory === "undefined")
  {
    // Only create products that have variants
     products = catalog.inventory.filter(product => product.variants.length);
    // Create variations and options (if needed)
    const variationsM = await variations(products);

  }
  else {
     products = catalog.inventory
  }

  console.log("products", products)

  for (let [index, product] of products.entries()) {
    try {
      console.log('Creating product [%s]', product.title);

      let productM = await Moltin.Products.Create({
        type: 'product',
        name: product.title,
        slug: product.title.replace(/[^A-Z0-9]/ig, "_"),
        status: 'live',
        price: [
          {
            amount: Number(product.price) * 100,
            currency: 'USD',
            includes_tax: true
          }
        ],
        sku: product.sku,
        manage_stock: false,
        commodity_type: 'physical',
        description: product.description
      });

      console.log(
        'Assigning product [%s] to category [%s]',
        product.title,
        catalog.category.category
      );


//TODO match on cat name and grab id products has name, so does categoriesM find and pull out id
  const categoryID = categoryID.find(products => categoriesM.category === category);
      await Moltin.Products.CreateRelationships(
        productM.data.id,
        'category',
        categoryID.id
      );

      console.log('Assiging applicable variations to %s', product.title);
      await assignImage(productM.data.id, product.image);

    } catch (error) {
      if (Array.isArray(error)) {
        error.forEach(console.error);
      } else {
        console.error(error);
      }
    }
  }

  // TODO pull down all files and match name and assign id
  const imagesM = await images(path, products);
  console.log("imges", imagesM)

  const assignImage = async (id, image) => {
  const imageM = imagesM.find(imageM => imageM.file_name === image);
    if (!imageM) {
      console.warn('Cannot find %s', image);
      return;
    }

  console.log('Assigning image %s to %s', imageM.file_name, id);

    await Moltin.Products.CreateRelationshipsRaw(id, 'main-image', {
      id: imageM.id,
      type: 'main_image'
    });
  };

  console.log('Products import complete');
};
