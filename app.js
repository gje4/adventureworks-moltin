'use strict';

process.on('unhandledRejection', reason => console.error(reason));

//TODO dyanmically make data format
const advw = require('./data/adventure-works');
const hybris = require('./data/hybris');

const imports = {
  //order matters
  files: require('./imports/images'),
  brands: require('./imports/brands'),
  categories: require('./imports/categories'),
  products: require('./imports/products')
};

//TODO form paramters
const argv = require('./argv');
const Moltin = require('./moltin');

(async function() {
  //TODO multiple parsing options pass in form data
  // const catalog = await advw(argv.path);
  const catalog = await hybris(argv.path);

  //then look to delete
  for (let entity of ['Products', 'Variations', 'Brands', 'Categories', 'Files']) {
    if (argv.clean(entity.toLowerCase())) {
      console.log('Catalog cleanup: removing %s', entity);
      await Moltin[entity].RemoveAll();
    }
  }

  //then look to Adding
  for (let entity of Object.keys(imports)) {
    if (!argv.skip(entity)) {
      console.log('Importing %s', entity);
      await imports[entity](argv.path, catalog);
    }
  }

  console.log('New moltin catalog is ready to go');
})();
