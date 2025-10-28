import postgres from 'postgres';

const database = import.meta.env.TBSP_DBNAME || 'tbsp';
const pg_user = import.meta.env.TBSP_DBUSER || import.meta.env.USER || 'postgres';
const pg_pass = import.meta.env.TBSP_DBPASS || (pg_user === 'postgres' ? 'postgres' : undefined);
const host = import.meta.env.TBSP_DBHOST || 'localhost';
const port = Number(import.meta.env.TBSP_DBPORT) || 5432;

let sql: postgres.Sql;
try {
  sql = postgres({
    host,
    port,
    database,
    username: pg_user,
    password: pg_pass,
  });
} catch (e) {
  // TODO: This error catch doesn't work (asynchronous callback)
  console.error(`Caught error: ${e}`);
  throw new Error(
    `Couldn't connect to postgres database ${database}. You may need to do \`createdb ${database}\` to set it up.`,
  );
}
export default sql;

export async function exampleQuery(age: number) {
  const matches = await sql`
	  SELECT username FROM users WHERE age = ${age};
  `;
  console.log(matches);
  return matches;
}

export async function runMigrations() {
  const sqlFile = await Bun.file('./migrations/initial.sql').text();
  await sql.unsafe(sqlFile);
}

// create some fake data so we can use the databases without errors
export async function createFakeData() {
  const userId = '00000000-0000-0000-0000-000000000001';
  const username = 'Mr. wiggles';
  const passwordHash = 'password';

  // create fake user
  try {
    await sql`
      INSERT INTO users (
        userId,
        username,
        passwordHash
      ) VALUES (
        ${userId},
        ${username},
        ${passwordHash}
      );
    `;
  } catch (error) {
    console.error('Failed to create user:', error);
  }

  const chatRoomId = '00000000-0000-0000-0000-000000000001';
  const gameId = '00000000-0000-0000-0000-000000000001';

  // create fake chatroom
  try {
    await sql`
      INSERT INTO chatrooms (
        chatroomId,
        gameId
      ) VALUES (
        ${chatRoomId},
        ${gameId}
      );
    `;
  } catch (error) {
    console.error('Failed to create chatroom:', error);
  }

  console.log('created? fake data.');
}

export async function dropTables() {
  await sql`
    DROP TABLE IF EXISTS
    usersInChatRoom,
    chatrooms,
    messages,
    users,
    games;
  `;
}

// Start of game:
// assign game ID
// create chatrooms with game ID
// assign each chatroom its ID
