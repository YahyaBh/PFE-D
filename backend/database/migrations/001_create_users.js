exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('users', function(table) {
    table.uuid('id').primary();
    table.string('name', 255);
    table.string('email', 255).unique().notNullable();
    table.string('password', 255).notNullable();
    table.string('phone', 255).unique();
    table.string('role', 20).defaultTo('ROLE_USER');
    table.string('status', 20).defaultTo('active');
    table.string('tier', 20).defaultTo('FREE');
    table.string('tier_id', 36);
    table.boolean('is_email_verified').defaultTo(false);
    table.boolean('is_phone_verified').defaultTo(false);
    table.string('email_verification_code', 10);
    table.string('phone_verification_code', 10);
    table.timestamp('verification_expires').nullable();
    table.json('face_descriptor');
    table.string('mfa_code', 10);
    table.timestamp('mfa_expires').nullable();
    table.string('kyc_status', 20).defaultTo('UNVERIFIED');
    table.integer('loyalty_points').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
