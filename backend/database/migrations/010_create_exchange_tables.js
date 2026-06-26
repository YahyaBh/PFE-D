exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('exchange_rates', function(table) {
      table.uuid('id').primary();
      table.string('base_currency', 3).defaultTo('MAD');
      table.string('target_currency', 3).notNullable();
      table.decimal('buy_rate', 10, 6).notNullable();
      table.decimal('sell_rate', 10, 6).notNullable();
      table.string('source', 50).defaultTo('seed');
      table.timestamp('last_fetched_at').nullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique(['base_currency', 'target_currency']);
    })
    .then(function() {
      return knex.raw(`INSERT IGNORE INTO exchange_rates (id, base_currency, target_currency, buy_rate, sell_rate) VALUES
        (UUID(), 'MAD', 'USD', 0.101000, 0.095000),
        (UUID(), 'MAD', 'EUR', 0.093000, 0.088000),
        (UUID(), 'MAD', 'GBP', 0.079000, 0.074000)`);
    })
    .then(function() {
      return knex.schema.createTableIfNotExists('currency_conversions', function(table) {
        table.uuid('id').primary();
        table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.string('from_currency', 10).notNullable();
        table.string('to_currency', 10).notNullable();
        table.decimal('gross_amount', 15, 2);
        table.decimal('fee', 15, 2);
        table.decimal('fee_percent', 5, 2);
        table.decimal('rate', 10, 6).notNullable();
        table.decimal('net_amount', 15, 2);
        table.string('transaction_id', 36);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('currency_conversions')
    .dropTableIfExists('exchange_rates');
};
