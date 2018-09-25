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
  const imagesM = await images(path, productsImport);
  console.log("images", productsImport);
  const imagesImport = []

  //Create product from import
  for (let [index, product] of productsImport.entries()) {
    if (product.title != "title") {
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
          description: product.description
        });

        console.log(
          "Assigning product id [%s] with cat name [%s]",
          productM.data.id,
          product.category
        );

        const categoryName = product.category;

        var productsCategory = categoriesM.find(function(productsCategory) {
          return productsCategory.name === categoryName;
        });
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
        const fullName = productM.data.sku + ".jpg";

        console.log(
          "Set up main image for product [%s] for product [%s]",
          productM.data.id,
          fullName
        );
        if (imagesImport == null)
        {
          imagesImport = await images(path, productsImport);
          console.log("import" , imagesImport)
        }


        var productsMainImage = imagesM.find(function(productsMainImage) {
          return productsMainImage.file_name === fullName;
        });
        console.log("check here", imagesM.length)

        console.log(
          "Assigning image %s to %s",
          productsMainImage,
          productM.data.id
        );

        await Moltin.Products.CreateRelationshipsRaw(
          productM.data.id,
          "main-image",
          {
            id: productsMainImage.id,
            type: "main_image"
          }
        );
      } catch (error) {
        if (Array.isArray(error)) {
          error.forEach(console.error);
        } else {
          console.error(error);
        }
      }
    }
  }
  console.log("Products import complete");
};
