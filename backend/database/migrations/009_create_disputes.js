exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('disputes', function(table) {
      table.uuid('id').primary();
      table.string('transaction_id', 36).notNullable();
      table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('reason', 255).notNullable();
      table.text('description');
      table.string('status', 20).defaultTo('OPEN');
      table.text('resolution_note');
      table.timestamps(true, true);
    })
    .createTableIfNotExists('dispute_messages', function(table) {
      table.uuid('id').primary();
      table.string('dispute_id', 36).notNullable();
      table.string('sender_id', 36).notNullable();
      table.text('message').notNullable();
      table.boolean('is_admin_reply').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('dispute_evidence', function(table) {
      table.uuid('id').primary();
      table.string('dispute_id', 36).notNullable();
      table.string('file_path', 255).notNullable();
      table.string('file_type', 50);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('dispute_evidence')
    .dropTableIfExists('dispute_messages')
    .dropTableIfExists('disputes');
};
