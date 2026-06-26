exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('notifications', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).notNullable();
      table.string('type', 50).notNullable();
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['user_id', 'is_read']);
    })
    .createTableIfNotExists('coupons', function(table) {
      table.uuid('id').primary();
      table.string('code', 50).unique().notNullable();
      table.text('description');
      table.decimal('discount_percentage', 5, 2).notNullable();
      table.integer('points_cost').defaultTo(100);
      table.timestamp('expiry_date').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('user_coupons', function(table) {
      table.uuid('id').primary();
      table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE').notNullable();
      table.string('coupon_id', 36).references('id').inTable('coupons').onDelete('CASCADE').notNullable();
      table.boolean('is_used').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_coupons')
    .dropTableIfExists('coupons')
    .dropTableIfExists('notifications');
};
