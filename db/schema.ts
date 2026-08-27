import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const savedStates = sqliteTable("saved_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stateKey: text("state_key").notNull().unique(),
  payload: text("payload").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
