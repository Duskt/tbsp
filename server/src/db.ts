import postgres from 'postgres';

const database = import.meta.env.TBSP_DBNAME || "TBSP";
let sql: postgres.Sql;
try {
    sql = postgres({ database });
} catch (e) {
    console.error(`Caught error: ${e}`);
    throw new Error(`Couldn't connect to postgres database ${database}. You may need to do \`createdb ${database}\` to set it up.`); 
}
export default sql;

export async function exampleQuery(age: number) {
    const matches = await sql`
	SELECT username FROM users WHERE age = ${ age }
    `
    console.log(matches);
    return matches;
}

// create table for messages
export async function createMessageTable(){
    await sql`
  CREATE TABLE IF NOT EXISTS messages (
    messageId SERIAL PRIMARY KEY,
    chatRoomId UUID REFERENCES chatrooms(chatroomId),
    timestamp timestamp,
    userId uuid REFERENCES users(userId),
    messageContent VARCHAR(512)
  )
`;

}
// create table for users
export async function createUserTable(){
    await sql`
  CREATE TABLE IF NOT EXISTS users (
    userId UUID PRIMARY KEY,
    username VARCHAR(16),
    passwordHash TEXT
  )
`;

}


// create chatroom table for chatrooms
export async function createChatroomsTable(){
  await sql`
CREATE TABLE IF NOT EXISTS chatrooms (
  chatroomId UUID PRIMARY KEY,
  gameId int
  )
`;

}


// create chatroom table for users in chatroom
export async function createUsersInChatroomTable(){
  await sql`
CREATE TABLE IF NOT EXISTS usersInChatroom (
  chatroomId UUID REFERENCES chatrooms(chatroomId),
  userId UUID REFERENCES users(userId)
  )
`;

}
// this function is to create some fake data so we can use the databases without errors
export async function createFakeData(){
  let chatRoomId = '00000000-0000-0000-0000-000000000001';
  let userId = '00000000-0000-0000-0000-000000000001';
  let gameId = 0

  // create fake user
  try{  
      await sql`
    INSERT INTO users (
      userId,
      username,
      passwordHash
    ) VALUES (
      ${userId},
      ${"Mr. wiggles"},
      ${"password"}
    )   
    `;
    }catch (error){
      console.error('Failed to create user:', error);
    }

    //create fake chatroom
    try{  
      await sql`
    INSERT INTO chatrooms (
      chatroomId,
      gameId
    ) VALUES (
      ${chatRoomId},
      ${gameId}
    )   
    `;
    }catch (error){
      console.error('Failed to create chatroom:', error);
    }
    console.log("created? fake data.")
}
// Start of game:
  // assign game ID
  // create chatrooms with game ID
  // assign each chatroom its ID
  
