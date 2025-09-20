import postgres from 'postgres';

const database = import.meta.env.TBSP_DBNAME || "TBSP";
const sql = postgres({ database });

export async function exampleQuery(age: number) {
    const matches = await sql`
	SELECT username FROM users WHERE age = ${ age }
    `
    console.log(matches);
    return matches;
}
