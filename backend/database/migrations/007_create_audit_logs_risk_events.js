exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('audit_logs', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).references('id').inTable('users').onDelete('SET NULL');
      table.string('action', 100).notNullable();
      table.string('resource', 100);
      table.text('old_value');
      table.text('new_value');
      table.string('ip_address', 45);
      table.text('device_info');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('risk_events', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).references('id').inTable('users').onDelete('SET NULL');
      table.string('event_type', 50).notNullable();
      table.integer('risk_score').defaultTo(0);
      table.json('details');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('risk_events')
    .dropTableIfExists('audit_logs');
};
