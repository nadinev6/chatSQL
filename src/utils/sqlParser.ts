export interface Table {
    id: number;
    name: string;
    columns: Column[];
}

export interface Column {
    name: string;
    type: string;
    pk: boolean;
    fk: boolean;
}

export interface Relation {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
}

export interface ParsedSchema {
    tables: Table[];
    relations: Relation[];
}

// This is a mock parser. A real implementation would need a robust SQL parser.
export const parseSchema = (sqlString: string): ParsedSchema => {
    if (!sqlString) return { tables: [], relations: [] };
    const tables: Table[] = [];
    const relations: Relation[] = [];

    const tableRegex = /CREATE TABLE\s+(\w+)\s+\(([^;]+)\);/gis;
    let match;
    while ((match = tableRegex.exec(sqlString)) !== null) {
        const tableName = match[1];
        const columnsStr = match[2];
        const columns = columnsStr.trim().split('\n').map(line => {
            const trimmedLine = line.trim().replace(/,$/, '');
            const parts = trimmedLine.split(/\s+/);
            const name = parts[0];
            const type = parts[1];
            const pk = trimmedLine.toUpperCase().includes('PRIMARY KEY');
            const fk = trimmedLine.toUpperCase().includes('REFERENCES');
            if (fk) {
                const refMatch = /REFERENCES\s+(\w+)\((\w+)\)/i.exec(trimmedLine);
                if (refMatch) {
                    relations.push({ fromTable: tableName, fromColumn: name, toTable: refMatch[1], toColumn: refMatch[2] });
                }
            }
            return { name, type, pk, fk };
        });
        tables.push({ id: tables.length, name: tableName, columns });
    }
    return { tables, relations };
};