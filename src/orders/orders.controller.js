const orders = require('../data/orders-data');
const nextId = require('../utils/nextId');
// const notFound = require('../errors/notFound')

function list(req, res) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order not found with ID: ${orderId}`,
    });
  }
  res.locals.order = foundOrder;
  next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // Validation checks for required fields
  if (!deliverTo) {
    return next({ status: 400, message: 'Order must include a deliverTo.' });
  }
  if (!mobileNumber) {
    return next({ status: 400, message: 'Order must include a mobileNumber.' });
  }

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: 'Order must include at least one dish.',
    });
  }

  // Validation checks for each dish in the order
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      !Number.isInteger(dish.quantity) ||
      dish.quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
      });
    }
  });

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function remove(req, res, next) {
  const { orderId } = req.params;
  const orderIndex = orders.findIndex((order) => order.id === orderId);

  if (orders[orderIndex].status !== 'pending') {
    return next({
      status: 400,
      message: 'An order cannot be deleted unless it is pending.',
    });
  }

  orders.splice(orderIndex, 1);
  res.sendStatus(204);
}

function validateCreate(req, res, next) {
  // make sure you access the data object
  const { orderId } = req.params;

  const { deliverTo, mobileNumber, dishes } = req.body.data;
  if (!deliverTo) {
    return next({
      status: 400,
      message: `Order must include a deliverTo`,
    });
  }
  if (!mobileNumber) {
    return next({
      status: 400,
      message: `Order must include a mobileNumber`,
    });
  }
  if (!dishes) {
    return next({
      status: 400,
      message: `Order must include a dish`,
    });
  }
  if (!Array.isArray(dishes) || !dishes.length) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity < 0 ||
      typeof dish.quantity !== 'number'
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  res.locals.order = req.body.data;
  next();
}

function validateUpdate(req, res, next) {
  const { orderId } = req.params;
  const { id, status } = req.body.data;
  if (id && id !== orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  if (!status) {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  if (status !== 'pending') {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery`,
    });
  }
  res.locals.order = { ...req.body.data, id: orderId };
  next();
}

function update(req, res, next) {
  res.status(200).json({ data: res.locals.order });
}

module.exports = {
  create,
  read: [orderExists, read],
  update: [orderExists, validateCreate, validateUpdate, update],
  delete: [orderExists, remove],
  list,
};
