exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('merchants', function(table) {
      table.uuid('id').primary();
      table.string('name', 100).notNullable();
      table.text('description');
      table.string('category', 50);
      table.string('status', 20).defaultTo('PENDING_APPROVAL');
      table.json('bank_info');
      table.json('documents_status');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('merchant_users', function(table) {
      table.uuid('id').primary();
      table.string('merchant_id', 36).references('id').inTable('merchants').onDelete('CASCADE').notNullable();
      table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('role', 20).defaultTo('OWNER');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('merchant_wallets', function(table) {
      table.uuid('id').primary();
      table.string('merchant_id', 36).references('id').inTable('merchants').onDelete('CASCADE').notNullable();
      table.decimal('balance', 20, 2).defaultTo(0);
      table.string('currency', 10).defaultTo('MAD');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('merchant_settlements', function(table) {
      table.uuid('id').primary();
      table.string('merchant_id', 36).references('id').inTable('merchants').onDelete('CASCADE').notNullable();
      table.decimal('amount', 20, 2).notNullable();
      table.string('currency', 10).defaultTo('MAD');
      table.string('status', 20).defaultTo('PENDING');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('merchant_settlements')
    .dropTableIfExists('merchant_wallets')
    .dropTableIfExists('merchant_users')
    .dropTableIfExists('merchants');
};
