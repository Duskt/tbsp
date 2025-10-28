-- create game table
CREATE TABLE IF NOT EXISTS games (gameId UUID primary key);

-- create users table
CREATE TABLE IF NOT EXISTS users (
  userId UUID PRIMARY KEY,
  username VARCHAR(16),
  passwordHash TEXT
);

--  create chatroom table
CREATE TABLE IF NOT EXISTS chatrooms (
  chatroomId UUID PRIMARY KEY,
  gameId UUID REFERENCES games (gameId)
);

-- create users in chatrooms table
CREATE TABLE IF NOT EXISTS usersInChatroom (
  chatroomId UUID REFERENCES chatrooms (chatroomId),
  userId UUID REFERENCES users (userId)
);

-- create messages table
CREATE TABLE IF NOT EXISTS messages (
  messageId SERIAL PRIMARY KEY,
  chatRoomId UUID REFERENCES chatrooms (chatroomId),
  timestamp timestamp,
  userId uuid REFERENCES users (userId),
  messageContent VARCHAR(512)
);