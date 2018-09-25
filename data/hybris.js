const fs = require("fs");
const csv = require("csv");
const _ = require("lodash");
const convertImages = require("./convert-images");
const preprocess = require("./preprocess");
const argv = require("../argv");

const utf16Multiline = {
  //formatting
  encoding: "utf16le",
  strip: true,
  delimiter: "|",
  rowDelimiter: "\r\n"
};

//take in feeds
const readCsvToArray = function(file, columns, opts) {
  console.log("columns", columns);
  console.log("file", file);

  // Pulling data out of the files
  const options = Object.assign(
    {
      encoding: "UTF-8",
      delimiter: ",",
      rowDelimiter: "\r\n",
      strip: false,
      skip_lines_with_error: true,
      relax_column_count: true
    },
    opts
  );

  return new Promise((resolve, reject) => {
    const result = [];

    fs.createReadStream(`${file}`, { encoding: options.encoding })
      .pipe(
        csv.parse({
          delimiter: options.delimiter,
          rowDelimiter: options.rowDelimiter,
          columns: !options.strip ? columns : columns.concat("ignore"),
          skip_lines_with_error: options.skip_lines_with_error,
          relax_column_count: options.relax_column_count
        })
      )
      .on("data", function(row) {
        for (let attr of Object.keys(row).filter(k => !!row[k])) {
          if (options.strip) {
            row[attr] = row[attr].slice(0, -1);
          }
          row[attr] = row[attr].trim();
        }
        result.push(row);
      })
      .on("end", function() {
        console.log("Read %s objects from %s file", result.length, file);
        resolve(result);
      })
      .on("error", function(error) {
        console.log("Error parsing %s", file);
        reject(error);
      });
  });
};

module.exports = async function(path = ".") {
  if (!argv.skip("preprocess-csv")) {
    // Preprocess ProductModel.csv so that csv parser could understand it
    await preprocess(`${path}/hybrisdata.csv`, { encoding: "utf16le" }, [
      /<root.+?>[\s\S]+?<\/root>/gm,
      /<p1:ProductDescription.+?>[\s\S]+?<\/p1:ProductDescription>/gm,
      /<\?.+?\?>/g
    ]);
    console.log("step 1");

    // if you want to data enrich the product data
    // Preprocess ProductDescription.csv so that csv parser could understand it
    await preprocess(`${path}/hybrisdata.csv`, { encoding: "utf16le" }, [/"/g]);
  }
  //need to be able to take in the objects we want to use
  const [
    //objects in order of maps
    categories,
    products
  ] = await Promise.all([
    //source data to parse
    readCsvToArray(`${path}/hybrisdata.csv`, [
      "sku",
      "title",
      "description",
      "category",
      "buy_url",
      "mobile_url",
      "image_url",
      "instock",
      "price",
      "availability_date",
      "currency",
      "brand",
      "mpn",
      "gtin",
      "condition",
      "size",
      "size_system",
      "shipping_weight",
      "shipping_length",
      "shipping_width",
      "shipping_height",
      "online_local_flag",
      "is_bundle",
      "price_range",
      "KOI_Flag",
      "MAP_Flag"
    ]),
    //product object example
    readCsvToArray(`${path}/hybrisdata.csv`, [
      "sku",
      "title",
      "description",
      "category",
      "buy_url",
      "mobile_url",
      "image_url",
      "instock",
      "price",
      "availability_date",
      "currency",
      "brand",
      "mpn",
      "gtin",
      "condition",
      "size",
      "size_system",
      "shipping_weight",
      "shipping_length",
      "shipping_width",
      "shipping_height",
      "online_local_flag",
      "is_bundle",
      "price_range",
      "KOI_Flag",
      "MAP_Flag"
    ])
  ]);

  console.log("invetory", products);
  console.log("cat", categories);

  //The objects that are returned
  return {
    inventory: products,
    categories
  };
};
