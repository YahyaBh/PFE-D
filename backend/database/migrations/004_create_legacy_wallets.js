exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('wallets', function(table) {
    table.uuid('id').primary();
    table.string('user_id', 36).unique().references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.decimal('balance', 15, 2).defaultTo(0);
    table.string('currency', 10).defaultTo('MAD');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('wallets');
};
