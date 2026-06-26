exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('tiers', function(table) {
    table.uuid('id').primary();
    table.string('name', 20).unique().notNullable();
    table.decimal('fee_percent', 5, 2).defaultTo(0);
    table.decimal('daily_limit', 12, 2).defaultTo(50000);
    table.decimal('monthly_limit', 12, 2).defaultTo(500000);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  }).then(function() {
    return knex.raw(`INSERT IGNORE INTO tiers (id, name, fee_percent, daily_limit, monthly_limit) VALUES
      ('tier-free', 'FREE', 2.5, 5000, 50000),
      ('tier-bronze', 'BRONZE', 1.5, 10000, 100000),
      ('tier-silver', 'SILVER', 1.0, 20000, 200000),
      ('tier-gold', 'GOLD', 0.5, 50000, 500000),
      ('tier-premium', 'PREMIUM', 0.0, 100000, 1000000),
      ('tier-ultimate', 'ULTIMATE', 0.0, 500000, 5000000)`);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tiers');
};
