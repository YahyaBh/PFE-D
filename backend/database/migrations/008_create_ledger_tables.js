exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('ledger_accounts', function(table) {
      table.uuid('id').primary();
      table.string('owner_id', 36);
      table.string('name', 100).notNullable();
      table.string('type', 50).notNullable();
      table.decimal('balance', 12, 2).defaultTo(0);
      table.string('currency', 10).defaultTo('MAD');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .then(function() {
      return knex.raw(`INSERT IGNORE INTO ledger_accounts (id, name, type) VALUES
        ('system-bank-account', 'Marjane Reserve Bank', 'ASSET'),
        ('system-fees-account', 'Transaction Fees Revenue', 'REVENUE')`);
    })
    .then(function() {
      return knex.schema.createTableIfNotExists('ledger_entries', function(table) {
        table.uuid('id').primary();
        table.string('transaction_id', 36).notNullable();
        table.string('account_id', 36).notNullable();
        table.decimal('amount', 12, 2).notNullable();
        table.string('description', 255);
        table.timestamp('created_at').defaultTo(knex.fn.now());
      });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ledger_entries')
    .dropTableIfExists('ledger_accounts');
};
