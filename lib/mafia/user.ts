type ID = number;

export class User {
  username: string;
  passwordHash: string;
  userId: ID;
  gamesPlayed: number = 0;
  constructor(username: string, passwordHash: string, userId: ID, gamesPlayed: number = 0) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.userId = userId;
    this.gamesPlayed = gamesPlayed;
  }
}
