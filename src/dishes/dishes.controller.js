const dishes = require('../data/dishes-data');
const nextId = require('../utils/nextId');

function list(req, res) {
  res.json({ data: dishes });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data.hasOwnProperty(propertyName) && data[propertyName] !== '') {
      return next();
    }
    next({ status: 400, message: `Must include a valid ${propertyName}` });
  };
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    return next({ status: 404, message: `Dish not found with ID: ${dishId}` });
  }
  res.locals.dish = foundDish;
  next();
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  // Validation checks for required fields
  if (!name || !description || !price || !image_url) {
    return next({
      status: 400,
      message: 'All fields (name, description, price, image_url) are required.',
    });
  }

  // Validation for price
  if (typeof price !== 'number' || price < 0) {
    return next({ status: 400, message: 'price' });
  }

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const { dishId } = req.params;
  const dish = res.locals.dish;

  // Validation for data.id matching :dishId
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  // Validation for price
  if (price === undefined || typeof price !== 'number' || price <= 0) {
    return next({ status: 400, message: 'price' });
  }

  if (!name && !description && !price && !image_url) {
    return next({
      status: 400,
      message:
        'At least one of the following properties must be provided: name, description, price, image_url.',
    });
  }
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  create,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('image_url'),
    bodyDataHas('price'),
    update,
  ],
  list,
};
