import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const weekendState=sqliteTable('weekend_state',{
 id:text('id').primaryKey(),
 revision:integer('revision').notNull(),
 body:text('body').notNull(),
 updatedAt:text('updated_at')
});
