exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('transactions', function(table) {
      table.uuid('id').primary();
      table.string('sender_wallet_id', 36);
      table.string('receiver_wallet_id', 36);
      table.decimal('amount', 15, 2).notNullable();
      table.string('currency', 10).notNullable();
      table.string('type', 50).notNullable();
      table.string('status', 20).defaultTo('PENDING');
      table.text('note');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('cards', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('wallet_id', 36);
      table.string('card_number', 20).notNullable();
      table.string('card_holder', 100);
      table.string('expiry_date', 5);
      table.string('cvv', 4);
      table.string('status', 20).defaultTo('ACTIVE');
      table.decimal('balance', 12, 2).defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('device_sessions', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('device', 255);
      table.string('ip', 45);
      table.timestamp('last_login').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('device_sessions')
    .dropTableIfExists('cards')
    .dropTableIfExists('transactions');
};
