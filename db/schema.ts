import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  tripJson: text('trip_json').notNull(),
  createdAt: text('created_at').notNull(),
  isSaved: integer('is_saved').notNull().default(0),
}, table => [index('trips_owner_created_idx').on(table.ownerId, table.createdAt)]);
