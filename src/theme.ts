interface ThemeProperties {
    id: string,
    name: string
}

/*
/* A theme specifies the factions and role list present in a Mafia game. It can even
 * alter certain mechanics like voting.
 */
export class Theme implements ThemeProperties {
    id: string;
    name: string;
    constructor({id, name}: ThemeProperties) {
	this.id = id;
	this.name = name;
    }
}

const vanilla = new Theme({ id: 'vanilla', name: "Vanilla"});
const classic = new Theme({ id: 'classic', name: "Classic"});

const defaultThemes = [vanilla, classic];
export default defaultThemes;
