import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, Link2 } from 'lucide-react';
import { parseSchema, Table as TableType, Relation } from '../../utils/sqlParser';

interface TableProps {
    table: TableType;
    style: React.CSSProperties;
}

const Table: React.ForwardRefRenderFunction<HTMLDivElement, TableProps> = ({ table, style }: TableProps, ref) => (
    <div ref={ref} className="bg-gray-800 rounded-lg shadow-lg absolute border border-gray-700" style={style}>
        <div className="bg-gray-900 px-4 py-2 rounded-t-lg">
            <h4 className="font-bold text-white">{table.name}</h4>
        </div>
        <ul className="p-4 space-y-2">
            {table.columns.map(col => (
                <li key={col.name} className="flex items-center">
                    {col.pk && <KeyRound className="w-4 h-4 text-yellow-400 mr-2" />}
                    {col.fk && <Link2 className="w-4 h-4 text-blue-400 mr-2" />}
                    <span className={!col.pk && !col.fk ? 'ml-6' : ''}>{col.name}</span>
                    <span className="text-gray-500 ml-auto">{col.type}</span>
                </li>
            ))}
        </ul>
    </div>
);

const TableComponent = React.forwardRef(Table);

interface VisualSchemaViewerProps {
    sql: string;
}

const VisualSchemaViewer: React.FC<VisualSchemaViewerProps> = ({ sql }: VisualSchemaViewerProps) => {
    const { tables, relations } = parseSchema(sql);
    const tableRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});

    const [positions, setPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
    const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);

    useEffect(() => {
        const initialPositions: { [key: string]: { x: number; y: number } } = {};
        tables.forEach((table, i) => {
            initialPositions[table.name] = { x: (i % 3) * 300 + 50, y: Math.floor(i / 3) * 250 + 50 };
        });
        setPositions(initialPositions);
        tableRefs.current = tables.reduce((acc, table) => {
            acc[table.name] = React.createRef();
            return acc;
        }, {} as { [key: string]: React.RefObject<HTMLDivElement> });
    }, [sql]); // Rerun layout when SQL changes

    useEffect(() => {
        if (Object.keys(positions).length === 0) return;
        const newLines = relations.map((rel) => {
            const fromTable = tableRefs.current[rel.fromTable]?.current;
            const toTable = tableRefs.current[rel.toTable]?.current;
            if (fromTable && toTable) {
                const fromPos = positions[rel.fromTable];
                const toPos = positions[rel.toTable];
                return {
                    x1: fromPos.x + fromTable.offsetWidth / 2,
                    y1: fromPos.y + fromTable.offsetHeight / 2,
                    x2: toPos.x + toTable.offsetWidth / 2,
                    y2: toPos.y + toTable.offsetHeight / 2,
                };
            }
            return null;
        }).filter(Boolean) as Array<{ x1: number; y1: number; x2: number; y2: number }>;
        setLines(newLines);
    }, [positions, relations, tables]);

    if (tables.length === 0) {
        return <div className="p-4 text-gray-400">No schema to display. Generate one from the chat.</div>;
    }

    return (
        <div className="relative w-full h-full overflow-auto bg-gray-900 rounded-b-lg">
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
                {lines.map((line, i) => (
                    <path
                        key={i}
                        d={`M ${line.x1} ${line.y1} C ${line.x1 + 50} ${line.y1}, ${line.x2 - 50} ${line.y2}, ${line.x2} ${line.y2}`}
                        stroke="#4a5568"
                        strokeWidth="2"
                        fill="none"
                    />
                ))}
            </svg>
            {tables.map(table => (
                <TableComponent
                    key={table.id}
                    ref={tableRefs.current[table.name]}
                    table={table}
                    style={{
                        left: `${positions[table.name]?.x || 0}px`,
                        top: `${positions[table.name]?.y || 0}px`,
                        zIndex: 1,
                        cursor: 'grab'
                    }}
                />
            ))}
        </div>
    );
};

export default VisualSchemaViewer;