'use strict';

const _ = require('lodash');
const variations = require('./variations');
const images = require('./images');
const Moltin = require('../moltin');

module.exports = async function(path, catalog) {
  const categoriesM = (await Moltin.Categories.Tree()).data;

  // Only create products that have variants
  const products = catalog.inventory.filter(product => product.variants.length);

  // Create variations and options (if needed)
  const variationsM = await variations(products);

  // Load all images (if needed)
  const imagesM = await images(path, products);

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

  for (let [index, product] of products.entries()) {
    // Select the first variant to get some variant-level properties that Moltin needs at the product level
    for (let attr of ['category', 'price', 'image']) {
      product[attr] = product.variants[0][attr];
    }

    // Adventure Works products have variants that all belong to the same category
    const category = categoriesM
      .concat(_.flatMap(categoriesM, c => c.children || []))
      .find(c => c.name === product.category.name);

    if (!category) {
      console.error("Can't find a category for %s", product.category.name);
      continue;
    }

    try {
      console.log('Creating product [%s]', product.name);

      let productM = await Moltin.Products.Create({
        type: 'product',
        name: product.name,
        slug: product.name.toLowerCase().replace(/[^A-Z0-9]/ig, "_"),
        status: 'live',
        price: [
          {
            amount: Number(product.price),
            currency: 'USD',
            includes_tax: true
          }
        ],
        sku: `AW_${index}`,
        manage_stock: false,
        commodity_type: 'physical',
        description: product.description
      });

      console.log(
        'Assigning product [%s] to category [%s]',
        product.name,
        category.name
      );

      await Moltin.Products.CreateRelationships(
        productM.data.id,
        'category',
        category.id
      );

      console.log('Assiging applicable variations to %s', product.name);

      await Moltin.Products.CreateRelationshipsRaw(
        productM.data.id,
        'variations',
        variationsM.data
          .filter(variation =>
            product.modifiers.some(mod => mod.title === variation.name)
          )
          .map(variation => ({
            id: variation.id,
            type: variation.type
          }))
      );

      await assignImage(productM.data.id, product.image.large_filename);

      // build product variants
      /*
      I am not building the variants using the "magic" build process.
      https://moltin.com/blog/2017/06/introducing-variations-options-modifiers/

      Adventure Works has 18 sizes and 9 colors and means 162 combinations.
      Running a build will create that many products (variants) for each parent product.
      I would then need to prune the list to only retain relevant variants.

      Instead, I am creating the variants by hand.
      */

      // const build = await Moltin.Products.Build(result.data.id);

      // create the variants manually (vs. using the /build endpoint)
      for (let [index, variant] of product.variants.entries()) {
        console.log(
          'Creating a product variant %s - %s',
          variant.name,
          variant.sku
        );

        const variantM = await Moltin.Products.Create({
          type: 'product',
          name: variant.name,
          slug: variant.name.toLowerCase().replace(/[^A-Z0-9]/ig, "_") + `_${index + 1}`,
          status: 'live',
          price: [
            {
              amount: Number(variant.price),
              currency: 'USD',
              includes_tax: true
            }
          ],
          sku: variant.sku,
          manage_stock: false,
          commodity_type: 'physical',
          // This is the only way to rememebr what size and color this variant represents
          // without using flows and without actually building the matrix (see the rationale above).
          // Plus, we need to remember the variant's parent product.
          // I wouldn't need to do it if I used /build but I have already explained why I decided against it.
          // And variants don't have descriptions in AW anyway.
          description: JSON.stringify({
            parent: productM.data.id,
            size: variant.size,
            color: variant.color
          })
        });

        await assignImage(variantM.data.id, variant.image.large_filename);
      }
    } catch (error) {
      if (Array.isArray(error)) {
        error.forEach(console.error);
      } else {
        console.error(error);
      }
    }
  }

  console.log('Products import complete');
};
