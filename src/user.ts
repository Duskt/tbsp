
type ID = number;
export class User{
    username: string;
    passwordHash: string;
    userId: ID;
    games_played: number =0;
    constructor(username: string, passwordHash: string, userId: ID, games_played: number = 0){
        this.username = username;
        this.passwordHash = passwordHash;
        this.userId = userId;
        this.games_played = games_played;
    }
}
