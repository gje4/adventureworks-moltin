"use strict";

const _ = require("lodash");
const variations = require("./variations");
const images = require("./images");
const Moltin = require("../moltin");

module.exports = async function(path, catalog) {
  //Fetch catalog form moltin that should have been already imported from feed
  const categoriesM = (await Moltin.Categories.Tree()).data;
  const productsImport = catalog.inventory;
  console.log("cats", categoriesM);
  console.log("products", productsImport);

  // //only do varients if they are dataMapPassed
  // if (catalog.inventory === 'undefined') {
  //   // Only create products that have variants
  //   products = catalog.inventory.filter(product => product.variants.length);
  //   // Create variations and options (if needed)
  //   const variationsM = await variations(products);
  // } else {
  //   products = catalog.inventory;
  // }

  //Create product from import
  for (let [index, product] of productsImport.entries()) {
    if (product.title != 'title') {
      try {
        console.log("Creating product [%s]", product.title);

        let productM = await Moltin.Products.Create({
          type: "product",
          name: product.title,
          slug: product.title.replace(/[^A-Z0-9]/gi, "_"),
          status: "live",
          price: [
            {
              amount: Number(product.price) * 100,
              currency: "USD",
              includes_tax: true
            }
          ],
          sku: product.sku,
          manage_stock: false,
          commodity_type: "physical",
          description: product.description,

        });

        console.log(
          "Assigning product id [%s] with cat name [%s]",
          productM.data.id,
          product.category
        );

        const categoryName = product.category

        var productsCategory = categoriesM.find(function (productsCategory) { return productsCategory.name === categoryName; });
        console.log(
          " from cat name [%s], to category [%s],",
          productsCategory,
          categoryName
        );

        await Moltin.Products.CreateRelationships(
          productM.data.id,
          "category",
          productsCategory.id
        );

        //TODO now set up main image and file stuff
        console.log(
          "Set up main image [%s] for product [%s]",
          product.image,
          product.image
        );

        await assignImage(product.image, product.image);
      } catch (error) {
        if (Array.isArray(error)) {
          error.forEach(console.error);
        } else {
          console.error(error);
        }
      }
    }
  }
  //End of creating product and tying category to product

  // TODO pull down all files and match name and assign id
  const imagesM = await images(path, productsImport);
  console.log("imges", imagesM);

  const assignImage = async (id, image) => {
    const imageM = imagesM.find(imageM => imageM.file_name === image);
    if (!imageM) {
      console.warn("Cannot find %s", image);
      return;
    }

    console.log("Assigning image %s to %s", imageM.file_name, id);

    await Moltin.Products.CreateRelationshipsRaw(id, "main-image", {
      id: imageM.id,
      type: "main_image"
    });
  };

  console.log("Products import complete");
};
