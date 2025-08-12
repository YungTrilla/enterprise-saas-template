'use strict';
/**
 * Common types used across all Abyss Suite services
 * Following the data exchange standards from the roadmap
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.LogLevel =
  exports.SubscriptionTier =
  exports.EmployeeRole =
  exports.ItemStatus =
  exports.OrderStatus =
    void 0;
// Standard enum types (UPPER_SNAKE_CASE format)
var OrderStatus;
(function (OrderStatus) {
  OrderStatus['DRAFT'] = 'DRAFT';
  OrderStatus['PENDING_APPROVAL'] = 'PENDING_APPROVAL';
  OrderStatus['CONFIRMED'] = 'CONFIRMED';
  OrderStatus['IN_PREPARATION'] = 'IN_PREPARATION';
  OrderStatus['OUT_FOR_DELIVERY'] = 'OUT_FOR_DELIVERY';
  OrderStatus['DELIVERED'] = 'DELIVERED';
  OrderStatus['IN_USE'] = 'IN_USE';
  OrderStatus['PICKUP_SCHEDULED'] = 'PICKUP_SCHEDULED';
  OrderStatus['OUT_FOR_PICKUP'] = 'OUT_FOR_PICKUP';
  OrderStatus['RETURNED'] = 'RETURNED';
  OrderStatus['COMPLETED'] = 'COMPLETED';
  OrderStatus['CANCELLED'] = 'CANCELLED';
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var ItemStatus;
(function (ItemStatus) {
  ItemStatus['AVAILABLE'] = 'AVAILABLE';
  ItemStatus['RESERVED'] = 'RESERVED';
  ItemStatus['RENTED'] = 'RENTED';
  ItemStatus['MAINTENANCE'] = 'MAINTENANCE';
  ItemStatus['DAMAGED'] = 'DAMAGED';
  ItemStatus['OUT_OF_SERVICE'] = 'OUT_OF_SERVICE';
})(ItemStatus || (exports.ItemStatus = ItemStatus = {}));
var EmployeeRole;
(function (EmployeeRole) {
  EmployeeRole['ADMIN'] = 'ADMIN';
  EmployeeRole['MANAGER'] = 'MANAGER';
  EmployeeRole['DISPATCHER'] = 'DISPATCHER';
  EmployeeRole['DRIVER'] = 'DRIVER';
  EmployeeRole['TECHNICIAN'] = 'TECHNICIAN';
  EmployeeRole['SALES'] = 'SALES';
  EmployeeRole['CUSTOMER_SERVICE'] = 'CUSTOMER_SERVICE';
})(EmployeeRole || (exports.EmployeeRole = EmployeeRole = {}));
var SubscriptionTier;
(function (SubscriptionTier) {
  SubscriptionTier['FREE'] = 'FREE';
  SubscriptionTier['LITE'] = 'LITE';
  SubscriptionTier['PRO'] = 'PRO';
  SubscriptionTier['ENTERPRISE'] = 'ENTERPRISE';
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
// Log levels for structured logging
var LogLevel;
(function (LogLevel) {
  LogLevel['DEBUG'] = 'DEBUG';
  LogLevel['INFO'] = 'INFO';
  LogLevel['WARN'] = 'WARN';
  LogLevel['ERROR'] = 'ERROR';
})(LogLevel || (exports.LogLevel = LogLevel = {}));
