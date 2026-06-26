exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('refresh_tokens', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('token_hash', 255).notNullable();
      table.timestamp('expires_at').notNullable();
      table.text('device_info');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('idempotency_keys', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('idempotency_key', 255).notNullable();
      table.integer('response_status').notNullable();
      table.text('response_body');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['user_id', 'idempotency_key']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('idempotency_keys')
    .dropTableIfExists('refresh_tokens');
};
