exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('wallet_accounts', function(table) {
    table.uuid('id').primary();
    table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('currency', 10).notNullable();
    table.decimal('balance', 15, 2).defaultTo(0);
    table.string('type', 10).defaultTo('fiat');
    table.string('status', 20).defaultTo('active');
    table.string('label', 50);
    table.timestamps(true, true);
    table.unique(['user_id', 'currency']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wallet_accounts');
};
