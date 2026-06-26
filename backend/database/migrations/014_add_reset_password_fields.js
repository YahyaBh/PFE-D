exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.string('reset_token', 255).nullable();
    table.timestamp('reset_expires').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('reset_token');
    table.dropColumn('reset_expires');
  });
};
