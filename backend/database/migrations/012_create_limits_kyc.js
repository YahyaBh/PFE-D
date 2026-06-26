exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('wallet_limits', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).unique().references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.decimal('daily_transfer_limit', 12, 2).defaultTo(5000);
      table.decimal('monthly_transfer_limit', 12, 2).defaultTo(50000);
      table.decimal('daily_withdrawal_limit', 12, 2).defaultTo(10000);
      table.decimal('monthly_withdrawal_limit', 12, 2).defaultTo(100000);
      table.decimal('daily_deposit_limit', 12, 2).defaultTo(20000);
      table.decimal('monthly_deposit_limit', 12, 2).defaultTo(200000);
      table.string('currency', 10).defaultTo('MAD');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('kyc_verifications', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).unique().references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('status', 20).defaultTo('UNVERIFIED');
      table.integer('risk_score').defaultTo(0);
      table.text('rejection_reason');
      table.timestamp('submitted_at').nullable();
      table.timestamp('reviewed_at').nullable();
      table.string('reviewed_by', 100);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('kyc_documents', function(table) {
      table.uuid('id').primary();
      table.string('verification_id', 36).references('id').inTable('kyc_verifications').onDelete('CASCADE').notNullable();
      table.string('type', 20).notNullable();
      table.string('file_path', 500).notNullable();
      table.string('file_name', 255).notNullable();
      table.string('status', 20).defaultTo('PENDING');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('kyc_reviews', function(table) {
      table.uuid('id').primary();
      table.string('verification_id', 36).references('id').inTable('kyc_verifications').onDelete('CASCADE').notNullable();
      table.string('action', 30).notNullable();
      table.text('note');
      table.string('reviewed_by', 100).defaultTo('SYSTEM');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('kyc_reviews')
    .dropTableIfExists('kyc_documents')
    .dropTableIfExists('kyc_verifications')
    .dropTableIfExists('wallet_limits');
};
