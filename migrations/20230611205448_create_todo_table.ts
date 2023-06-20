import { Knex } from "knex";

const defaultUUID = `(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`;

export async function up(knex: Knex): Promise<void> {
    const exists: boolean = await knex.schema.hasTable("todos");
    if (!exists) {
        await knex.schema.createTable("todos", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw(defaultUUID));
        table.string("title");
        table.string("description", 255).nullable();
        table
            .string("state", 255)
            .checkIn(["created", "inProgress", "done"])
            .defaultTo("created");
        table.timestamps(true, true);
    });
}
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("todos");
}

